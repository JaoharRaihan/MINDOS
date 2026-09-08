import { createApp } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { captureException } from './middleware/errorHandler';

// ─── Process-level safety net ─────────────────────────────────────────────────
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down:', err);
  captureException(err, 'uncaughtException');
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('UNHANDLED REJECTION — shutting down:', err);
  captureException(err, 'unhandledRejection');
  process.exit(1);
});

const startServer = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Start HTTP server
    const app = createApp();
    const server = app.listen(env.PORT, () => {
      logger.info(`MindOS Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      if (env.SENTRY_DSN) {
        logger.info('Sentry error reporting: enabled');
      }
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start MindOS server:', error);
    process.exit(1);
  }
};

startServer();
