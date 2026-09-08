import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { submitFeedback, getUserFeedbackSummary } from '../services/feedbackService';

const submitFeedbackSchema = z.object({
  sessionId: z.string(),
  rating: z.enum(['not_at_all', 'a_little', 'somewhat', 'a_lot']),
  perceivedShifts: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});

export const createFeedback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const data = submitFeedbackSchema.parse(req.body);

    const feedback = await submitFeedback({
      userId: req.user._id.toString(),
      sessionId: data.sessionId,
      rating: data.rating,
      perceivedShifts: data.perceivedShifts,
      notes: data.notes,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback recorded successfully',
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const summary = await getUserFeedbackSummary(req.user._id.toString());

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    next(error);
  }
};
