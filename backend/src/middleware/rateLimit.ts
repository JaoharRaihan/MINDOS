/**
 * rateLimit.ts
 * Production-grade rate limiting middleware for MindOS API.
 * Uses environment-driven configuration so limits can be tuned per deployment.
 *
 * Auth endpoints:  10 req / 15 min  (brute-force protection)
 * General API:    200 req / 15 min  (fair-use ceiling)
 */
import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10); // 15 min default
const generalMax = parseInt(process.env.RATE_LIMIT_MAX ?? '200', 10);
const authMax = 10;

/** Applied to /api/auth/* — tight limit to prevent credential brute-forcing. */
export const authRateLimit = rateLimit({
  windowMs,
  max: authMax,
  standardHeaders: true,  // Sends X-RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait a few minutes and try again.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/** Applied to all other /api/* routes. */
export const generalRateLimit = rateLimit({
  windowMs,
  max: generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again shortly.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});
