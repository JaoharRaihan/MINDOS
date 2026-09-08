import mongoose from 'mongoose';
import {
  InterventionFeedback,
  IInterventionFeedback,
  FeedbackRating,
  RATING_SCORES,
} from '../models/InterventionFeedback';
import { InterventionSession } from '../models/InterventionSession';
import { Intervention } from '../models/Intervention';

export interface SubmitFeedbackInput {
  userId: string;
  sessionId: string;
  rating: FeedbackRating;
  perceivedShifts?: string[];
  notes?: string;
}

export const submitFeedback = async (
  input: SubmitFeedbackInput
): Promise<IInterventionFeedback> => {
  const session = await InterventionSession.findOne({
    _id: input.sessionId,
    userId: new mongoose.Types.ObjectId(input.userId),
  });

  if (!session) {
    throw new Error('Intervention session not found');
  }

  const ratingScore = RATING_SCORES[input.rating] || 2;

  const feedback = await InterventionFeedback.create({
    userId: session.userId,
    sessionId: session._id,
    interventionId: session.interventionId,
    interventionSlug: session.interventionSlug,
    rating: input.rating,
    ratingScore,
    perceivedShifts: input.perceivedShifts || [],
    notes: input.notes,
  });

  return feedback;
};

export interface UserFeedbackSummary {
  totalFeedbackCount: number;
  averageRating: number;
  topHelpfulInterventions: Array<{
    interventionSlug: string;
    title: string;
    averageScore: number;
    count: number;
  }>;
  commonShifts: Array<{
    shift: string;
    count: number;
  }>;
}

export const getUserFeedbackSummary = async (
  userId: string
): Promise<UserFeedbackSummary> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const feedbacks = await InterventionFeedback.find({ userId: userObjectId })
    .sort({ createdAt: -1 })
    .limit(50);

  if (feedbacks.length === 0) {
    return {
      totalFeedbackCount: 0,
      averageRating: 0,
      topHelpfulInterventions: [],
      commonShifts: [],
    };
  }

  const totalRatingSum = feedbacks.reduce((acc, f) => acc + f.ratingScore, 0);
  const averageRating = Number((totalRatingSum / feedbacks.length).toFixed(1));

  // Aggregate by intervention
  const interventionMap = new Map<string, { totalScore: number; count: number }>();
  const shiftCounts = new Map<string, number>();

  for (const f of feedbacks) {
    const prev = interventionMap.get(f.interventionSlug) || { totalScore: 0, count: 0 };
    interventionMap.set(f.interventionSlug, {
      totalScore: prev.totalScore + f.ratingScore,
      count: prev.count + 1,
    });

    for (const shift of f.perceivedShifts) {
      shiftCounts.set(shift, (shiftCounts.get(shift) || 0) + 1);
    }
  }

  const interventions = await Intervention.find({
    slug: { $in: Array.from(interventionMap.keys()) },
  });

  const titleBySlug = new Map(interventions.map((i) => [i.slug, i.title]));

  const topHelpfulInterventions = Array.from(interventionMap.entries())
    .map(([slug, data]) => ({
      interventionSlug: slug,
      title: titleBySlug.get(slug) || slug,
      averageScore: Number((data.totalScore / data.count).toFixed(1)),
      count: data.count,
    }))
    .filter((item) => item.averageScore >= 2.5)
    .sort((a, b) => b.averageScore - a.averageScore);

  const commonShifts = Array.from(shiftCounts.entries())
    .map(([shift, count]) => ({ shift, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalFeedbackCount: feedbacks.length,
    averageRating,
    topHelpfulInterventions,
    commonShifts,
  };
};
