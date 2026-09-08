import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { TriageLog, TriageTrigger } from '../models/TriageLog';
import { getTriageOptions, getCrisisResources } from '../services/helpMeNowService';

const triageSchema = z.object({
  trigger: z.enum([
    'anxious',
    'racing_thoughts',
    'overwhelmed',
    'cant_focus',
    'low',
    'cant_sleep',
    'lonely',
    'dont_know',
  ]),
});

const logActionSchema = z.object({
  logId: z.string().optional(),
  trigger: z.enum([
    'anxious',
    'racing_thoughts',
    'overwhelmed',
    'cant_focus',
    'low',
    'cant_sleep',
    'lonely',
    'dont_know',
  ]).optional(),
  chosenAction: z.enum(['talk', 'calm', 'journal', 'focus', 'human_support']),
});

export const submitTriage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { trigger } = triageSchema.parse(req.body);

    const log = await TriageLog.create({
      userId: req.user._id,
      trigger: trigger as TriageTrigger,
    });

    const triage = getTriageOptions(trigger as TriageTrigger);

    res.status(200).json({
      success: true,
      logId: log._id,
      trigger,
      triage,
    });
  } catch (error) {
    next(error);
  }
};

export const getResources = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const resources = getCrisisResources();
  res.status(200).json({
    success: true,
    resources,
  });
};

export const logChosenAction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { logId, trigger, chosenAction } = logActionSchema.parse(req.body);

    if (logId) {
      await TriageLog.findByIdAndUpdate(logId, { chosenAction });
    } else if (trigger) {
      await TriageLog.create({
        userId: req.user._id,
        trigger,
        chosenAction,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Triage action recorded',
    });
  } catch (error) {
    next(error);
  }
};
