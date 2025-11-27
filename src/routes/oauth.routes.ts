/**
 * OAuth Routes
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  isAuthenticated,
  removeTokens,
} from '../services/oauth.service';
import { asyncHandler } from '../middleware';
import { logger } from '../utils';

const router = Router();

// Store OAuth states (use Redis in production)
const stateStore = new Map<string, { createdAt: Date }>();

/**
 * Initiate OAuth flow
 */
router.get(
  '/authorize',
  asyncHandler(async (req: Request, res: Response) => {
    // Generate random state
    const state = crypto.randomBytes(32).toString('hex');
    stateStore.set(state, { createdAt: new Date() });

    // Clean up old states
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    for (const [key, value] of stateStore.entries()) {
      if (value.createdAt < fiveMinutesAgo) {
        stateStore.delete(key);
      }
    }

    const authUrl = getAuthorizationUrl(state);

    logger.info('OAuth flow initiated', { state: state.substring(0, 10) + '...' });

    res.redirect(authUrl);
  })
);

/**
 * OAuth callback
 */
router.get(
  '/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      logger.error('OAuth error', { error, error_description });
      res.status(400).json({
        error: 'OAuth error',
        message: error_description || error,
      });
      return;
    }

    // Validate state
    if (!state || typeof state !== 'string' || !stateStore.has(state)) {
      logger.warn('Invalid OAuth state');
      res.status(400).json({
        error: 'Invalid state',
        message: 'OAuth state parameter is invalid or expired',
      });
      return;
    }

    // Remove used state
    stateStore.delete(state);

    // Validate code
    if (!code || typeof code !== 'string') {
      res.status(400).json({
        error: 'Missing code',
        message: 'Authorization code is required',
      });
      return;
    }

    try {
      const tokens = await exchangeCodeForTokens(code);

      logger.info('OAuth successful', { portalId: tokens.portalId });

      // Return success page or redirect
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f5f8fa;
              }
              .success {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .checkmark {
                font-size: 48px;
                color: #00a4bd;
              }
              h1 { color: #33475b; }
              p { color: #516f90; }
            </style>
          </head>
          <body>
            <div class="success">
              <div class="checkmark">✓</div>
              <h1>Successfully Connected!</h1>
              <p>Your HubSpot portal (ID: ${tokens.portalId}) is now connected.</p>
              <p>You can close this window.</p>
            </div>
          </body>
        </html>
      `);
    } catch (err) {
      logger.error('Token exchange failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      res.status(500).json({
        error: 'Token exchange failed',
        message: 'Failed to complete authorization',
      });
    }
  })
);

/**
 * Check authentication status
 */
router.get('/status/:portalId', (req: Request, res: Response) => {
  const portalId = parseInt(req.params.portalId, 10);

  if (isNaN(portalId)) {
    res.status(400).json({ error: 'Invalid portal ID' });
    return;
  }

  res.json({
    authenticated: isAuthenticated(portalId),
    portalId,
  });
});

/**
 * Disconnect (logout)
 */
router.post('/disconnect/:portalId', (req: Request, res: Response) => {
  const portalId = parseInt(req.params.portalId, 10);

  if (isNaN(portalId)) {
    res.status(400).json({ error: 'Invalid portal ID' });
    return;
  }

  removeTokens(portalId);

  res.json({
    success: true,
    message: 'Disconnected successfully',
  });
});

export default router;
