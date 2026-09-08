import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('30d'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  // Observability
  SENTRY_DSN: z.string().url().optional(),
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),  // 15 min
  RATE_LIMIT_MAX: z.string().default('200'),
}).refine(
  (data) => {
    // In production, enforce stronger secret minimums
    if (data.NODE_ENV === 'production') {
      return data.JWT_ACCESS_SECRET.length >= 32 && data.JWT_REFRESH_SECRET.length >= 32;
    }
    return true;
  },
  {
    message: 'In production, JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must each be at least 32 characters',
    path: ['JWT_ACCESS_SECRET'],
  }
);

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
