import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  listInterventions,
  getInterventionBySlug,
  getInterventionById,
  startInterventionSession,
  completeInterventionSession,
  abandonInterventionSession,
} from '../services/interventionService';
import { rankInterventions } from '../services/rankingService';

const listQuerySchema = z.object({
  category: z.enum(['calm', 'focus', 'grounding', 'release', 'rest']).optional(),
  trigger: z.string().optional(),
  maxDuration: z.coerce.number().optional(),
});

const startSessionSchema = z.object({
  interventionId: z.string(),
  contextTrigger: z.string().optional(),
});

const finishSessionSchema = z.object({
  sessionId: z.string(),
  completedSteps: z.number().min(0),
  durationSpentSeconds: z.number().min(0),
});

export const getInterventions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = listQuerySchema.parse(req.query);
    const interventions = await listInterventions(filters);

    res.status(200).json({
      success: true,
      count: interventions.length,
      interventions,
    });
  } catch (error) {
    next(error);
  }
};

export const getIntervention = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.params;

    let intervention = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      intervention = await getInterventionById(identifier);
    }
    if (!intervention) {
      intervention = await getInterventionBySlug(identifier);
    }

    if (!intervention) {
      throw new AppError('Intervention not found', 404);
    }

    res.status(200).json({
      success: true,
      intervention,
    });
  } catch (error) {
    next(error);
  }
};

export const startSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { interventionId, contextTrigger } = startSessionSchema.parse(req.body);

    const session = await startInterventionSession(
      req.user._id.toString(),
      interventionId,
      contextTrigger
    );

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const completeSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { sessionId, completedSteps, durationSpentSeconds } =
      finishSessionSchema.parse(req.body);

    const session = await completeInterventionSession(
      sessionId,
      completedSteps,
      durationSpentSeconds
    );

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Intervention completed successfully',
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const abandonSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { sessionId, completedSteps, durationSpentSeconds } =
      finishSessionSchema.parse(req.body);

    const session = await abandonInterventionSession(
      sessionId,
      completedSteps,
      durationSpentSeconds
    );

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Intervention session abandoned',
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedInterventions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const { mood, trigger, timeOfDay, tags } = req.query;
    const tagArray = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : undefined;

    const recommendations = await rankInterventions(req.user._id.toString(), {
      mood: typeof mood === 'string' ? mood : undefined,
      trigger: typeof trigger === 'string' ? trigger : undefined,
      tags: tagArray,
      timeOfDay:
        timeOfDay === 'morning' ||
        timeOfDay === 'afternoon' ||
        timeOfDay === 'evening' ||
        timeOfDay === 'night'
          ? timeOfDay
          : undefined,
    });

    res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

