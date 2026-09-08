import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import packageJson from '../../package.json';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const dbReadyState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = dbReadyState === 1 ? 'connected' : dbReadyState === 2 ? 'connecting' : 'disconnected';
  const isHealthy = process.env.NODE_ENV === 'test' || dbReadyState === 1;
  const memoryUsage = process.memoryUsage();

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    service: 'MindOS API Gateway',
    version: packageJson.version,
    environment: process.env.NODE_ENV ?? 'development',
    db: {
      status: dbStatus,
      name: mongoose.connection.name || 'n/a',
    },
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
    },
  });
});

export default router;
