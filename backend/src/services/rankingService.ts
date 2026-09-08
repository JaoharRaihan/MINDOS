import mongoose from 'mongoose';
import { Intervention, IIntervention } from '../models/Intervention';
import { InterventionFeedback } from '../models/InterventionFeedback';
import { InterventionSession } from '../models/InterventionSession';
import { SupportProfile } from '../models/SupportProfile';
import { ICheckin } from '../models/Checkin';
import { getNextStepRecommendation } from './recommendationService';

export interface RankingContext {
  mood?: string;
  tags?: string[];
  trigger?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface RankedIntervention {
  intervention: IIntervention;
  totalScore: number;
  components: {
    contextFit: number;
    userHistoricalScore: number;
    timeOfDayFit: number;
    recencyPenalty: number;
  };
  reasoning: string;
}

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

export const rankInterventions = async (
  userId: string,
  context?: RankingContext
): Promise<RankedIntervention[]> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const timeOfDay = context?.timeOfDay || getTimeOfDay();
  const currentMood = context?.mood;
  const currentTags = context?.tags || [];
  const currentTrigger = context?.trigger;

  // 1. Fetch all active interventions
  const interventions = await Intervention.find({ isActive: true });
  if (interventions.length === 0) return [];

  // 2. Fetch user's feedback history
  const feedbacks = await InterventionFeedback.find({ userId: userObjectId });
  const feedbackBySlug = new Map<string, { totalScore: number; count: number; shifts: string[] }>();
  for (const f of feedbacks) {
    const prev = feedbackBySlug.get(f.interventionSlug) || {
      totalScore: 0,
      count: 0,
      shifts: [],
    };
    feedbackBySlug.set(f.interventionSlug, {
      totalScore: prev.totalScore + f.ratingScore,
      count: prev.count + 1,
      shifts: [...prev.shifts, ...f.perceivedShifts],
    });
  }

  // 3. Fetch user's recent sessions for recency penalty
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const recentSessions = await InterventionSession.find({
    userId: userObjectId,
    startedAt: { $gte: twoHoursAgo },
  });
  const recentSlugs = new Set(recentSessions.map((s) => s.interventionSlug));

  // 4. Fetch Support Profile for preferred intervention types
  const profile = await SupportProfile.findOne({ userId: userObjectId });
  const preferredTypes = profile?.preferredInterventionTypes || [];

  const ranked: RankedIntervention[] = [];

  for (const item of interventions) {
    // Component A: Context Fit (0.1 to 1.0)
    let contextFit = 0.2;
    if (currentMood && item.suitableForTriggers.includes(currentMood)) {
      contextFit += 0.4;
    }
    if (currentTrigger && item.suitableForTriggers.includes(currentTrigger)) {
      contextFit += 0.4;
    }
    const tagMatch = item.tags.filter((t) => currentTags.includes(t)).length;
    if (tagMatch > 0) {
      contextFit += Math.min(0.3, tagMatch * 0.15);
    }
    contextFit = Math.min(1.0, Math.max(0.1, contextFit));

    // Component B: User Historical Score (0.1 to 1.0)
    let userHistoricalScore = 0.5; // neutral prior
    let reasoning = 'Curated match for your current state.';

    const hist = feedbackBySlug.get(item.slug);
    if (hist && hist.count > 0) {
      const avgRating = hist.totalScore / hist.count; // 1 to 4
      userHistoricalScore = avgRating / 4.0; // 0.25 to 1.0

      if (avgRating >= 3.5) {
        reasoning = `Ranked #1 based on your feedback: you previously rated this ${avgRating.toFixed(1)}/4.`;
        if (hist.shifts.length > 0) {
          reasoning += ` It helped you feel ${hist.shifts[0].replace('_', ' ')}.`;
        }
      } else if (avgRating <= 2.0) {
        reasoning = `Adjusted lower because it previously brought lower relief.`;
      }
    } else {
      // Prior from Support Profile preferences
      const matchesPreference = preferredTypes.some((pref) => {
        if (pref === 'breathing' && item.category === 'calm') return true;
        if (pref === 'task_breakdown' && item.category === 'focus') return true;
        if (pref === 'sensory_reset' && item.category === 'grounding') return true;
        if (pref === 'physical' && item.slug === 'micro-walk-hydration') return true;
        return false;
      });

      if (matchesPreference) {
        userHistoricalScore = 0.7;
        reasoning = `Aligned with your preferred ${item.category} support style.`;
      }
    }

    // Component C: Time of Day Fit (0.1 to 1.0)
    let timeOfDayFit = 0.5;
    if (timeOfDay === 'night') {
      if (item.category === 'rest') timeOfDayFit = 1.0;
      else if (item.category === 'calm') timeOfDayFit = 0.85;
      else if (item.category === 'focus') timeOfDayFit = 0.2;
    } else if (timeOfDay === 'evening') {
      if (item.category === 'calm' || item.category === 'release') timeOfDayFit = 0.9;
      else if (item.category === 'rest') timeOfDayFit = 0.8;
      else timeOfDayFit = 0.6;
    } else if (timeOfDay === 'morning' || timeOfDay === 'afternoon') {
      if (item.category === 'focus') timeOfDayFit = 0.95;
      else if (item.category === 'calm' || item.category === 'release') timeOfDayFit = 0.85;
      else if (item.category === 'grounding') timeOfDayFit = 0.8;
      else if (item.category === 'rest') timeOfDayFit = 0.3;
    }

    // Component D: Recency Penalty (-0.25 to 0.0)
    let recencyPenalty = 0;
    if (recentSlugs.has(item.slug)) {
      recencyPenalty = -0.25;
      reasoning += ' (Suggested recently)';
    }

    // Formula: 35% Context + 40% History + 15% Time of Day + Recency Penalty
    const totalScore = Number(
      (
        contextFit * 0.35 +
        userHistoricalScore * 0.4 +
        timeOfDayFit * 0.15 +
        recencyPenalty
      ).toFixed(3)
    );

    ranked.push({
      intervention: item,
      totalScore,
      components: {
        contextFit,
        userHistoricalScore,
        timeOfDayFit,
        recencyPenalty,
      },
      reasoning,
    });
  }

  // Sort descending by totalScore
  ranked.sort((a, b) => b.totalScore - a.totalScore);
  return ranked;
};

export interface PersonalizedNextStep {
  title: string;
  context: string;
  actionLabel: string;
  actionType: 'task_breakdown' | 'breathing' | 'talk' | 'journal' | 'focus' | 'checkin';
  durationMinutes: number;
  interventionSlug?: string;
  personalizationReasoning?: string;
}

export const getPersonalizedNextStep = async (
  userId: string,
  checkin: ICheckin | null
): Promise<PersonalizedNextStep> => {
  if (!checkin) {
    return {
      title: 'How are you feeling right now?',
      context: 'Take 30 seconds to notice where your mind is before diving into the day.',
      actionLabel: 'Check in now',
      actionType: 'checkin',
      durationMinutes: 1,
    };
  }

  const context: RankingContext = {
    mood: checkin.mood,
    tags: checkin.tags,
  };

  const ranked = await rankInterventions(userId, context);
  if (ranked.length === 0) {
    const profile = await SupportProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    return getNextStepRecommendation(checkin, profile);
  }

  const top = ranked[0];
  const intervention = top.intervention;

  let actionType: PersonalizedNextStep['actionType'] = 'task_breakdown';
  if (intervention.category === 'calm' || intervention.category === 'grounding') {
    actionType = 'breathing';
  } else if (intervention.category === 'focus') {
    actionType = 'focus';
  } else if (intervention.category === 'release') {
    actionType = 'task_breakdown';
  }

  return {
    title: intervention.title,
    context: intervention.shortDescription,
    actionLabel: `Start ${Math.round(intervention.durationSeconds / 60)} min`,
    actionType,
    durationMinutes: Math.round(intervention.durationSeconds / 60),
    interventionSlug: intervention.slug,
    personalizationReasoning: top.reasoning,
  };
};
