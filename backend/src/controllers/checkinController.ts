import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { Checkin } from '../models/Checkin';
import { DailyProgress } from '../models/DailyProgress';
import { SupportProfile } from '../models/SupportProfile';
import { getNextStepRecommendation } from '../services/recommendationService';
import { getPersonalizedNextStep } from '../services/rankingService';

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getTimeGreeting = (preferredName?: string): string => {
  const hour = new Date().getHours();
  let timeStr = 'Good morning 👋';
  if (hour >= 12 && hour < 17) {
    timeStr = 'Good afternoon ☀️';
  } else if (hour >= 17) {
    timeStr = 'Good evening 🌙';
  }

  return preferredName ? `${timeStr}, ${preferredName}` : timeStr;
};

const checkinSchema = z.object({
  mood: z.enum(['great', 'neutral', 'down', 'overwhelmed', 'exhausted']),
  energyLevel: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional().default([]),
  note: z.string().max(500).optional(),
  date: z.string().optional(),
});

const toggleChecklistSchema = z.object({
  item: z.enum(['checkin', 'smallAction', 'eveningReflection']),
  completed: z.boolean().optional(),
});

export const submitCheckin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const validated = checkinSchema.parse(req.body);
    const date = validated.date || getTodayDateString();

    const checkin = await Checkin.findOneAndUpdate(
      { userId: req.user._id, date },
      {
        mood: validated.mood,
        energyLevel: validated.energyLevel,
        tags: validated.tags,
        note: validated.note,
        date,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update DailyProgress milestone
    await DailyProgress.findOneAndUpdate(
      { userId: req.user._id, date },
      { checkinDone: true },
      { upsert: true, new: true }
    );

    const nextStep = await getPersonalizedNextStep(req.user._id.toString(), checkin);

    res.status(200).json({
      success: true,
      message: 'Check-in saved',
      checkin,
      nextStep,
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayCheckin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const date = getTodayDateString();
    const checkin = await Checkin.findOne({ userId: req.user._id, date });

    res.status(200).json({
      success: true,
      checkin,
    });
  } catch (error) {
    next(error);
  }
};

export const getHomeFeed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const date = getTodayDateString();

    const [todayCheckin, progress] = await Promise.all([
      Checkin.findOne({ userId: req.user._id, date }),
      DailyProgress.findOne({ userId: req.user._id, date }),
    ]);

    const greeting = getTimeGreeting(req.user.preferredName || req.user.name);
    const nextStep = await getPersonalizedNextStep(req.user._id.toString(), todayCheckin);

    const checklist = {
      checkin: progress?.checkinDone ?? Boolean(todayCheckin),
      smallAction: progress?.smallActionDone ?? false,
      eveningReflection: progress?.eveningReflectionDone ?? false,
    };

    const quickNeeds = [
      { id: 'talk', label: 'Talk' },
      { id: 'calm', label: 'Calm' },
      { id: 'focus', label: 'Focus' },
      { id: 'journal', label: 'Journal' },
    ];

    res.status(200).json({
      success: true,
      greeting,
      todayCheckin,
      nextStep,
      checklist,
      quickNeeds,
      date,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleChecklistItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { item, completed } = toggleChecklistSchema.parse(req.body);
    const date = getTodayDateString();

    let progress = await DailyProgress.findOne({ userId: req.user._id, date });
    if (!progress) {
      progress = new DailyProgress({ userId: req.user._id, date });
    }

    if (item === 'checkin') {
      progress.checkinDone = completed !== undefined ? completed : !progress.checkinDone;
    } else if (item === 'smallAction') {
      progress.smallActionDone = completed !== undefined ? completed : !progress.smallActionDone;
    } else if (item === 'eveningReflection') {
      progress.eveningReflectionDone =
        completed !== undefined ? completed : !progress.eveningReflectionDone;
    }

    await progress.save();

    res.status(200).json({
      success: true,
      checklist: {
        checkin: progress.checkinDone,
        smallAction: progress.smallActionDone,
        eveningReflection: progress.eveningReflectionDone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCheckinHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const days = parseInt((req.query.days as string) || '14', 10);
    const checkins = await Checkin.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(days);

    res.status(200).json({
      success: true,
      history: checkins,
    });
  } catch (error) {
    next(error);
  }
};
