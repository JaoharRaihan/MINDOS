import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { Journal } from '../models/Journal';
import { DailyProgress } from '../models/DailyProgress';
import { generateAIReflection } from '../services/aiReflectionService';

const createJournalSchema = z.object({
  content: z.string().min(1, 'Journal content cannot be empty'),
  type: z.enum(['text', 'voice']).default('text'),
  audioDurationSeconds: z.number().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export const createEntry = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const validated = createJournalSchema.parse(req.body);

    const aiReflection = generateAIReflection(validated.content);

    const entry = new Journal({
      userId: req.user._id,
      content: validated.content,
      type: validated.type,
      audioDurationSeconds: validated.audioDurationSeconds,
      tags: validated.tags,
      isPrivate: true,
      aiReflection,
    });

    await entry.save();

    // Mark today's evening reflection milestone as done
    const todayDate = new Date().toISOString().split('T')[0];
    await DailyProgress.findOneAndUpdate(
      { userId: req.user._id, date: todayDate },
      { eveningReflectionDone: true },
      { upsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Journal entry saved privately',
      entry,
    });
  } catch (error) {
    next(error);
  }
};

export const getEntries = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      Journal.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Journal.countDocuments({ userId: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      entries,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEntryById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const entry = await Journal.findOne({ _id: id, userId: req.user._id });

    if (!entry) {
      throw new AppError('Journal entry not found', 404);
    }

    res.status(200).json({
      success: true,
      entry,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEntry = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const deleted = await Journal.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!deleted) {
      throw new AppError('Journal entry not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Journal entry permanently deleted',
    });
  } catch (error) {
    next(error);
  }
};
