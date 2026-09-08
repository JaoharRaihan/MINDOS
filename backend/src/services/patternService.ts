import mongoose from 'mongoose';
import { Checkin } from '../models/Checkin';
import { TriageLog } from '../models/TriageLog';
import { InterventionFeedback } from '../models/InterventionFeedback';
import { SupportProfile } from '../models/SupportProfile';
import { Intervention } from '../models/Intervention';

export interface SleepEnergyCorrelation {
  hasSufficientData: boolean;
  averageEnergyWithSleepIssue: number | null;
  averageEnergyBaseline: number | null;
  difference: number | null;
  observation: string;
}

export interface OverwhelmContextPattern {
  totalOverwhelmOrExhaustionCheckins: number;
  topTriggers: Array<{
    tag: string;
    count: number;
    percentage: number;
  }>;
  observation: string;
}

export interface TimeOfDayPattern {
  peakPeriod: 'morning' | 'afternoon' | 'evening' | 'night' | 'balanced';
  periodCounts: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  observation: string;
}

export interface PlaybookStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface PersonalPlaybook {
  id: 'overwhelmed' | 'cant_start' | 'exhausted';
  title: string;
  subtitle: string;
  recommendedInterventionSlug: string;
  recommendedInterventionTitle: string;
  durationMinutes: number;
  actionLabel: string;
  steps: PlaybookStep[];
  personalRationale: string;
}

export interface UserPatternsResult {
  sleepEnergy: SleepEnergyCorrelation;
  overwhelmContext: OverwhelmContextPattern;
  timeOfDayRhythms: TimeOfDayPattern;
  helpfulStrategies: Array<{
    interventionSlug: string;
    name: string;
    score: number; // 1 to 10
    totalSessions: number;
  }>;
  playbooks: PersonalPlaybook[];
  disclaimer: string;
}

const SLUG_TITLES: Record<string, string> = {
  'five-minute-start': '5-Minute Micro-Start',
  'box-breathing': '4x4 Box Breathing',
  'grounding-54321': '5-4-3-2-1 Sensory Reset',
  'wind-down-478': '4-7-8 Wind Down',
  'physiological-sigh': 'Physiological Sigh',
  'thought-dump': 'Private Thought Dump',
  'micro-walk-hydration': 'Hydration & Micro-Walk',
};

const getTimePeriod = (date: Date): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

export const analyzeUserPatterns = async (userId: string): Promise<UserPatternsResult> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [checkins, triageLogs, feedbacks, profile] = await Promise.all([
    Checkin.find({ userId: userObjectId }).sort({ date: -1 }),
    TriageLog.find({ userId: userObjectId }),
    InterventionFeedback.find({ userId: userObjectId }),
    SupportProfile.findOne({ userId: userObjectId }),
  ]);

  // 1. Sleep vs Energy Correlation
  const checkinsWithEnergy = checkins.filter((c) => typeof c.energyLevel === 'number');
  const sleepIssueTags = ['sleep', 'fatigue', 'tired', 'insomnia'];

  const sleepIssueCheckins = checkinsWithEnergy.filter((c) =>
    c.tags.some((t) => sleepIssueTags.includes(t.toLowerCase()))
  );
  const baselineCheckins = checkinsWithEnergy.filter(
    (c) => !c.tags.some((t) => sleepIssueTags.includes(t.toLowerCase()))
  );

  let sleepEnergy: SleepEnergyCorrelation;
  if (sleepIssueCheckins.length >= 1 && baselineCheckins.length >= 1) {
    const sumSleep = sleepIssueCheckins.reduce((acc, curr) => acc + (curr.energyLevel || 0), 0);
    const sumBase = baselineCheckins.reduce((acc, curr) => acc + (curr.energyLevel || 0), 0);

    const avgWithSleep = Number((sumSleep / sleepIssueCheckins.length).toFixed(1));
    const avgBase = Number((sumBase / baselineCheckins.length).toFixed(1));
    const diff = Number((avgWithSleep - avgBase).toFixed(1));

    let observation = 'Your self-reported energy remains relatively consistent across sleep entries.';
    if (diff <= -0.5) {
      observation = `Your stress reports tend to be higher following shorter sleep nights (energy dips from ${avgBase}/5 to ${avgWithSleep}/5).`;
    } else if (diff >= 0.5) {
      observation = `You report higher stamina on days with restful nights (${avgWithSleep}/5 vs ${avgBase}/5).`;
    }

    sleepEnergy = {
      hasSufficientData: true,
      averageEnergyWithSleepIssue: avgWithSleep,
      averageEnergyBaseline: avgBase,
      difference: diff,
      observation,
    };
  } else {
    sleepEnergy = {
      hasSufficientData: false,
      averageEnergyWithSleepIssue: null,
      averageEnergyBaseline:
        checkinsWithEnergy.length > 0
          ? Number(
              (
                checkinsWithEnergy.reduce((acc, curr) => acc + (curr.energyLevel || 0), 0) /
                checkinsWithEnergy.length
              ).toFixed(1)
            )
          : null,
      difference: null,
      observation:
        'Continue checking in to reveal how your sleep quality shapes your daily energy reserves.',
    };
  }

  // 2. Overwhelm & Context Triggers
  const stressCheckins = checkins.filter((c) =>
    ['overwhelmed', 'exhausted', 'down'].includes(c.mood)
  );

  const tagCounts: Record<string, number> = {};
  for (const c of stressCheckins) {
    for (const tag of c.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const sortedTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: stressCheckins.length > 0 ? Math.round((count / stressCheckins.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  let overwhelmObservation =
    'Your check-ins show balanced states with no dominant stress triggers.';
  if (sortedTags.length > 0 && stressCheckins.length > 0) {
    const top = sortedTags[0];
    overwhelmObservation = `${top.percentage}% of your high-stress check-ins coincided with ${top.tag.replace('_', ' ')}.`;
  }

  const overwhelmContext: OverwhelmContextPattern = {
    totalOverwhelmOrExhaustionCheckins: stressCheckins.length,
    topTriggers: sortedTags.slice(0, 5),
    observation: overwhelmObservation,
  };

  // 3. Time of Day Rhythms
  const periodCounts = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  for (const t of triageLogs) {
    const period = getTimePeriod(t.createdAt);
    periodCounts[period]++;
  }

  for (const c of stressCheckins) {
    const period = getTimePeriod(c.createdAt);
    periodCounts[period]++;
  }

  const totalTimePoints =
    periodCounts.morning + periodCounts.afternoon + periodCounts.evening + periodCounts.night;

  let peakPeriod: TimeOfDayPattern['peakPeriod'] = 'balanced';
  let timeObservation = 'Your moments of fatigue are evenly distributed throughout the day.';

  if (totalTimePoints >= 2) {
    const entries = Object.entries(periodCounts) as Array<[
      'morning' | 'afternoon' | 'evening' | 'night',
      number
    ]>;
    entries.sort((a, b) => b[1] - a[1]);
    const [highestPeriod, highestCount] = entries[0];

    if (highestCount / totalTimePoints >= 0.4) {
      peakPeriod = highestPeriod;
      timeObservation = `You tend to experience the highest vulnerability to fatigue during ${highestPeriod} hours.`;
    }
  }

  const timeOfDayRhythms: TimeOfDayPattern = {
    peakPeriod,
    periodCounts,
    observation: timeObservation,
  };

  // 4. Helpful Strategies from Empirical Feedback
  const feedbackBySlug = new Map<string, { totalScore: number; count: number }>();
  for (const f of feedbacks) {
    const prev = feedbackBySlug.get(f.interventionSlug) || { totalScore: 0, count: 0 };
    feedbackBySlug.set(f.interventionSlug, {
      totalScore: prev.totalScore + f.ratingScore,
      count: prev.count + 1,
    });
  }

  const helpfulStrategies: UserPatternsResult['helpfulStrategies'] = [];
  feedbackBySlug.forEach((val, slug) => {
    const avg = val.totalScore / val.count;
    const score = Math.min(10, Math.max(1, Math.round((avg / 4.0) * 10)));
    helpfulStrategies.push({
      interventionSlug: slug,
      name: SLUG_TITLES[slug] || slug.replace(/-/g, ' '),
      score,
      totalSessions: val.count,
    });
  });

  helpfulStrategies.sort((a, b) => b.score - a.score);

  // Fallbacks if user hasn't completed feedback yet
  if (helpfulStrategies.length === 0) {
    helpfulStrategies.push(
      {
        interventionSlug: 'five-minute-start',
        name: '5-Minute Micro-Start',
        score: 8,
        totalSessions: 0,
      },
      {
        interventionSlug: 'box-breathing',
        name: '4x4 Box Breathing',
        score: 8,
        totalSessions: 0,
      },
      {
        interventionSlug: 'grounding-54321',
        name: '5-4-3-2-1 Sensory Reset',
        score: 7,
        totalSessions: 0,
      },
      {
        interventionSlug: 'wind-down-478',
        name: '4-7-8 Wind Down',
        score: 7,
        totalSessions: 0,
      }
    );
  }

  // 5. Personal Playbooks
  // Find top calm/grounding intervention for Overwhelm Playbook
  const calmSlug =
    helpfulStrategies.find((s) => ['box-breathing', 'grounding-54321', 'physiological-sigh'].includes(s.interventionSlug))
      ?.interventionSlug || 'box-breathing';

  // Find top focus/start intervention for Task Paralysis Playbook
  const focusSlug =
    helpfulStrategies.find((s) => ['five-minute-start', 'thought-dump'].includes(s.interventionSlug))
      ?.interventionSlug || 'five-minute-start';

  // Find top rest/wind-down intervention for Exhaustion Playbook
  const restSlug =
    helpfulStrategies.find((s) => ['wind-down-478', 'micro-walk-hydration'].includes(s.interventionSlug))
      ?.interventionSlug || 'wind-down-478';

  const playbooks: PersonalPlaybook[] = [
    {
      id: 'overwhelmed',
      title: "When I'm Overwhelmed",
      subtitle: 'Immediate sensory down-regulation when thoughts run fast',
      recommendedInterventionSlug: calmSlug,
      recommendedInterventionTitle: SLUG_TITLES[calmSlug] || 'Box Breathing',
      durationMinutes: 2,
      actionLabel: 'Start Reset',
      steps: [
        {
          stepNumber: 1,
          title: 'Pause the input stream',
          description: 'Put your phone face down and gently step away from your active screen.',
        },
        {
          stepNumber: 2,
          title: 'Somatic grounding',
          description: `Engage in a 2-minute ${SLUG_TITLES[calmSlug] || 'breathing exercise'} to slow heart rate.`,
        },
        {
          stepNumber: 3,
          title: 'Narrow the horizon',
          description: 'Refuse to plan beyond the next 15 minutes until equilibrium returns.',
        },
      ],
      personalRationale:
        feedbackBySlug.get(calmSlug)
          ? `Selected because you previously found ${SLUG_TITLES[calmSlug]} effective.`
          : 'Curated calming protocol suited to lower sympathetic nervous system arousal.',
    },
    {
      id: 'cant_start',
      title: "When I Can't Start",
      subtitle: 'Lowering the activation energy threshold on overwhelming tasks',
      recommendedInterventionSlug: focusSlug,
      recommendedInterventionTitle: SLUG_TITLES[focusSlug] || '5-Minute Micro-Start',
      durationMinutes: 5,
      actionLabel: 'Start 5 Min',
      steps: [
        {
          stepNumber: 1,
          title: 'Shrink the starting unit',
          description: 'Select the absolute smallest physical action (open document, write one sentence).',
        },
        {
          stepNumber: 2,
          title: 'Set a 5-minute permission timer',
          description: 'Work only for 300 seconds. You have unconditional permission to stop when the timer rings.',
        },
        {
          stepNumber: 3,
          title: 'Acknowledge the threshold',
          description: 'Starting is 80% of task resistance. Momentum usually takes care of the rest.',
        },
      ],
      personalRationale:
        'You seem to start tasks more easily when they are broken into small 5-minute steps.',
    },
    {
      id: 'exhausted',
      title: "When I'm Exhausted",
      subtitle: 'Low-stimulation restoration when your internal battery is drained',
      recommendedInterventionSlug: restSlug,
      recommendedInterventionTitle: SLUG_TITLES[restSlug] || '4-7-8 Wind Down',
      durationMinutes: 3,
      actionLabel: 'Begin Wind-Down',
      steps: [
        {
          stepNumber: 1,
          title: 'Lower sensory stimulation',
          description: 'Dim bright overhead lights and silence non-essential notifications.',
        },
        {
          stepNumber: 2,
          title: 'Hydration and restorative rest',
          description: 'Drink a glass of cool water and practice 4-7-8 parasympathetic breathing.',
        },
        {
          stepNumber: 3,
          title: 'Give yourself credit',
          description: 'Your value is not measured by relentless output. Rest is an essential component of functioning.',
        },
      ],
      personalRationale:
        'Aligned with your daily sleep rhythms and self-reported energy restoration needs.',
    },
  ];

  return {
    sleepEnergy,
    overwhelmContext,
    timeOfDayRhythms,
    helpfulStrategies,
    playbooks,
    disclaimer:
      'Self-reported pattern observations for personal reflection. MindOS does not provide clinical diagnoses or medical evaluations.',
  };
};
