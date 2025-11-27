/**
 * Express Application Setup
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {
  oauthRoutes,
  validationRoutes,
  crmCardRoutes,
  scorecardRoutes,
  alertRoutes,
  healthRoutes,
} from './routes';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  apiLimiter,
  authLimiter,
  validationLimiter,
} from './middleware';
import config from './config';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    })
  );

  // CORS
  app.use(
    cors({
      origin: config.nodeEnv === 'production' ? config.baseUrl : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-HubSpot-Signature', 'X-HubSpot-Signature-v3'],
    })
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Apply rate limiting in production
  if (config.nodeEnv === 'production') {
    app.use('/api/', apiLimiter);
  }

  // Routes with specific rate limiters
  app.use('/oauth', authLimiter, oauthRoutes);
  app.use('/api/validation', validationLimiter, validationRoutes);
  app.use('/crm-cards', crmCardRoutes);
  app.use('/api/scorecards', scorecardRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/health', healthRoutes);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'HubSpot Lifecycle Gate Governance App',
      version: '1.0.0',
      description: 'Enforces lifecycle and deal stage-gate validation rules',
      endpoints: {
        health: '/health',
        oauth: '/oauth/authorize',
        validation: '/api/validation',
        crmCards: '/crm-cards',
        scorecards: '/api/scorecards',
        alerts: '/api/alerts',
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
