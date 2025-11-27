/**
 * Server Entry Point
 */

import { createApp } from './app';
import config, { validateConfig } from './config';
import { logger } from './utils';

// Validate configuration
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration error', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
}

// Create and start server
const app = createApp();

const server = app.listen(config.port, () => {
  logger.info('Server started', {
    port: config.port,
    environment: config.nodeEnv,
    baseUrl: config.baseUrl,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

export { app, server };
