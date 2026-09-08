import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * captureException — forwards unhandled errors to Sentry in production.
 * Silently no-ops when SENTRY_DSN is not configured (dev/test environments).
 * Replace the body with `Sentry.captureException(err)` once @sentry/node is installed.
 */
export function captureException(err: Error, context?: string): void {
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) return;
  // Sentry SDK hook — uncomment after `npm install @sentry/node`:
  // Sentry.captureException(err, { extra: { context } });
  logger.error(`[Sentry stub] Captured exception${context ? ` in ${context}` : ''}:`, err.message);
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unhandled 500-class error — log and forward to Sentry in production
  logger.error('Unhandled internal server error:', err);
  captureException(err, 'errorHandler middleware');

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
