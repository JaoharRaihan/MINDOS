import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { Checkin } from '../models/Checkin';
import { Journal } from '../models/Journal';
import { InterventionFeedback, RATING_SCORES, FeedbackRating } from '../models/InterventionFeedback';
import { Intervention } from '../models/Intervention';
import { DailyProgress } from '../models/DailyProgress';
import { generateAIReflection } from '../services/aiReflectionService';

const batchSyncSchema = z.object({
  checkins: z
    .array(
      z.object({
        mood: z.enum(['great', 'neutral', 'down', 'overwhelmed', 'exhausted']),
        energyLevel: z.number().min(1).max(5).optional(),
        tags: z.array(z.string()).optional().default([]),
        note: z.string().max(500).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
        clientTimestamp: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  journalEntries: z
    .array(
      z.object({
        content: z.string().min(1),
        type: z.enum(['text', 'voice']).optional().default('text'),
        audioDurationSeconds: z.number().optional(),
        tags: z.array(z.string()).optional().default([]),
        clientTimestamp: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  feedbacks: z
    .array(
      z.object({
        sessionId: z.string().optional(),
        interventionSlug: z.string(),
        rating: z.enum(['not_at_all', 'a_little', 'somewhat', 'a_lot']),
        perceivedShifts: z.array(z.string()).optional().default([]),
        notes: z.string().optional(),
        clientTimestamp: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const batchSync = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { checkins, journalEntries, feedbacks } = batchSyncSchema.parse(req.body);
    const userId = req.user._id;

    const syncedCheckinIds: string[] = [];
    const syncedJournalIds: string[] = [];
    const syncedFeedbackIds: string[] = [];

    // 1. Process Check-ins
    for (const item of checkins) {
      const checkinDate = item.date;
      const createdAt = item.clientTimestamp ? new Date(item.clientTimestamp) : new Date();

      const checkin = await Checkin.findOneAndUpdate(
        { userId, date: checkinDate },
        {
          mood: item.mood,
          energyLevel: item.energyLevel,
          tags: item.tags,
          note: item.note,
          createdAt,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      syncedCheckinIds.push(checkin._id.toString());

      await DailyProgress.findOneAndUpdate(
        { userId, date: checkinDate },
        { checkinDone: true },
        { upsert: true }
      );
    }

    // 2. Process Journal Entries
    for (const item of journalEntries) {
      const createdAt = item.clientTimestamp ? new Date(item.clientTimestamp) : new Date();
      const aiReflection = generateAIReflection(item.content);

      const journal = new Journal({
        userId,
        content: item.content,
        type: item.type,
        audioDurationSeconds: item.audioDurationSeconds,
        tags: item.tags,
        isPrivate: true,
        aiReflection,
        createdAt,
      });

      await journal.save();
      syncedJournalIds.push(journal._id.toString());

      const dateStr = createdAt.toISOString().split('T')[0];
      await DailyProgress.findOneAndUpdate(
        { userId, date: dateStr },
        { eveningReflectionDone: true },
        { upsert: true }
      );
    }

    // 3. Process Feedbacks
    for (const item of feedbacks) {
      const createdAt = item.clientTimestamp ? new Date(item.clientTimestamp) : new Date();
      const ratingScore = RATING_SCORES[item.rating as FeedbackRating];

      // Find intervention by slug
      let interventionId: mongoose.Types.ObjectId;
      const intervention = await Intervention.findOne({ slug: item.interventionSlug });
      if (intervention) {
        interventionId = intervention._id as mongoose.Types.ObjectId;
      } else {
        interventionId = new mongoose.Types.ObjectId();
      }

      const sessionId = item.sessionId && mongoose.Types.ObjectId.isValid(item.sessionId)
        ? new mongoose.Types.ObjectId(item.sessionId)
        : new mongoose.Types.ObjectId();

      const feedback = new InterventionFeedback({
        userId,
        sessionId,
        interventionId,
        interventionSlug: item.interventionSlug,
        rating: item.rating,
        ratingScore,
        perceivedShifts: item.perceivedShifts,
        notes: item.notes,
        createdAt,
      });

      await feedback.save();
      syncedFeedbackIds.push(feedback._id.toString());
    }

    res.status(200).json({
      success: true,
      message: 'Batch synchronization completed successfully',
      synced: {
        checkins: syncedCheckinIds.length,
        journalEntries: syncedJournalIds.length,
        feedbacks: syncedFeedbackIds.length,
      },
      createdIds: {
        checkins: syncedCheckinIds,
        journalEntries: syncedJournalIds,
        feedbacks: syncedFeedbackIds,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const checkSyncStatus = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  res.status(200).json({
    success: true,
    status: 'online',
    serverTime: new Date().toISOString(),
  });
};
