/**
 * HubSpot Signature Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config';
import { logger } from '../utils';

/**
 * Validate HubSpot webhook signature (v2)
 */
export function validateHubSpotSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip validation in development if no secret configured
  if (config.nodeEnv !== 'production' && !config.hubspot.clientSecret) {
    return next();
  }

  const signature = req.headers['x-hubspot-signature-v3'] as string;
  const requestTimestamp = req.headers['x-hubspot-request-timestamp'] as string;

  if (!signature) {
    logger.warn('Missing HubSpot signature');
    res.status(401).json({ error: 'Missing signature' });
    return;
  }

  try {
    // Build the string to sign
    const method = req.method;
    const uri = `${config.baseUrl}${req.originalUrl}`;
    const body = JSON.stringify(req.body);
    const timestamp = requestTimestamp || '';

    const stringToSign = `${method}${uri}${body}${timestamp}`;

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', config.hubspot.clientSecret)
      .update(stringToSign)
      .digest('base64');

    // Compare signatures
    if (signature !== expectedSignature) {
      logger.warn('Invalid HubSpot signature', {
        path: req.path,
        expected: expectedSignature.substring(0, 10) + '...',
        received: signature.substring(0, 10) + '...',
      });
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Check timestamp freshness (5 minute window)
    if (requestTimestamp) {
      const timestampMs = parseInt(requestTimestamp, 10);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (Math.abs(now - timestampMs) > fiveMinutes) {
        logger.warn('HubSpot request timestamp too old');
        res.status(401).json({ error: 'Request expired' });
        return;
      }
    }

    next();
  } catch (error) {
    logger.error('Signature validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Signature validation failed' });
  }
}

/**
 * Simplified signature check for CRM cards (v2 signature)
 */
export function validateCRMCardSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip in development
  if (config.nodeEnv !== 'production') {
    return next();
  }

  const signature = req.headers['x-hubspot-signature'] as string;

  if (!signature) {
    logger.warn('Missing CRM card signature');
    res.status(401).json({ error: 'Missing signature' });
    return;
  }

  // CRM card signature validation
  const sourceString = config.hubspot.clientSecret + JSON.stringify(req.body);
  const expectedSignature = crypto.createHash('sha256').update(sourceString).digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Invalid CRM card signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
}
