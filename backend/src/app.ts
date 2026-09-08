import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import onboardingRouter from './routes/onboarding';
import profileRouter from './routes/profile';
import checkinRouter from './routes/checkin';
import journalRouter from './routes/journal';
import talkRouter from './routes/talk';
import helpRouter from './routes/help';
import interventionRouter from './routes/intervention';
import feedbackRouter from './routes/feedback';
import patternRouter from './routes/pattern';
import privacyRouter from './routes/privacy';
import safetyRouter from './routes/safety';
import syncRouter from './routes/sync';
import { errorHandler } from './middleware/errorHandler';
import { authRateLimit, generalRateLimit } from './middleware/rateLimit';

export const createApp = (): Application => {
  const app = express();

  // Security and utilities
  app.use(helmet());
  app.use(cors({
    origin: '*', // can be restricted to CLIENT_URL in production
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRateLimit, authRouter);
  app.use('/api/onboarding', generalRateLimit, onboardingRouter);
  app.use('/api/profile', generalRateLimit, profileRouter);
  app.use('/api/checkin', generalRateLimit, checkinRouter);
  app.use('/api/journal', generalRateLimit, journalRouter);
  app.use('/api/talk', generalRateLimit, talkRouter);
  app.use('/api/help', generalRateLimit, helpRouter);
  app.use('/api/interventions', generalRateLimit, interventionRouter);
  app.use('/api/feedback', generalRateLimit, feedbackRouter);
  app.use('/api/patterns', generalRateLimit, patternRouter);
  app.use('/api/privacy', generalRateLimit, privacyRouter);
  app.use('/api/safety', generalRateLimit, safetyRouter);
  app.use('/api/sync', generalRateLimit, syncRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp();
