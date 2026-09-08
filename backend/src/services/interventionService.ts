import mongoose from 'mongoose';
import { Intervention, IIntervention, InterventionCategory } from '../models/Intervention';
import { InterventionSession, IInterventionSession } from '../models/InterventionSession';
import { DailyProgress } from '../models/DailyProgress';
import { logger } from '../utils/logger';

export const DEFAULT_INTERVENTIONS = [
  {
    slug: 'grounding-54321',
    title: '5-4-3-2-1 Sensory Grounding',
    shortDescription: 'Anchor yourself in the present moment by noticing what is right in front of you.',
    category: 'grounding' as InterventionCategory,
    durationSeconds: 120,
    difficultyLevel: 'gentle' as const,
    order: 1,
    tags: ['anxiety', 'overwhelm', 'racing_thoughts', 'panic'],
    suitableForTriggers: ['anxious', 'racing_thoughts', 'overwhelmed', 'dont_know'],
    steps: [
      {
        stepNumber: 1,
        title: '5 Things you can see',
        instruction: 'Look around your room. Notice 5 specific objects (a book, the texture of a wall, shadows, your hands).',
        durationSeconds: 25,
      },
      {
        stepNumber: 2,
        title: '4 Things you can feel',
        instruction: 'Notice 4 physical sensations: your feet firm on the floor, clothing against your skin, chair supporting your back.',
        durationSeconds: 25,
      },
      {
        stepNumber: 3,
        title: '3 Things you can hear',
        instruction: 'Listen carefully for 3 distinct sounds: ceiling fan, distant Dhaka traffic, the hum of your computer.',
        durationSeconds: 25,
      },
      {
        stepNumber: 4,
        title: '2 Things you can smell or breathe',
        instruction: 'Notice any scent around you, or take 2 slow, deliberate diaphragmatic breaths.',
        durationSeconds: 25,
      },
      {
        stepNumber: 5,
        title: '1 Reassuring truth',
        instruction: 'Remind yourself: "I am safe right now in this room. I do not have to solve everything today."',
        durationSeconds: 20,
      },
    ],
  },
  {
    slug: 'box-breathing',
    title: 'Box Breathing (4-4-4-4)',
    shortDescription: 'Steady your nervous system with rhythmic, balanced breathing used to restore emotional equilibrium.',
    category: 'calm' as InterventionCategory,
    durationSeconds: 120,
    difficultyLevel: 'gentle' as const,
    order: 2,
    tags: ['anxiety', 'calm', 'breath', 'stress'],
    suitableForTriggers: ['anxious', 'overwhelmed', 'racing_thoughts'],
    steps: [
      {
        stepNumber: 1,
        title: 'Exhale completely',
        instruction: 'Release all air gently from your lungs through your mouth.',
        durationSeconds: 4,
      },
      {
        stepNumber: 2,
        title: 'Inhale smoothly',
        instruction: 'Inhale through your nose slowly for 4 counts.',
        durationSeconds: 4,
      },
      {
        stepNumber: 3,
        title: 'Hold breath gently',
        instruction: 'Keep your lungs full and relaxed for 4 counts. Do not strain.',
        durationSeconds: 4,
      },
      {
        stepNumber: 4,
        title: 'Exhale slowly',
        instruction: 'Exhale smoothly through your mouth for 4 counts.',
        durationSeconds: 4,
      },
      {
        stepNumber: 5,
        title: 'Hold on empty',
        instruction: 'Pause with lungs relaxed and empty for 4 counts before next breath.',
        durationSeconds: 4,
      },
    ],
  },
  {
    slug: 'five-minute-start',
    title: '5-Minute Micro-Start',
    shortDescription: 'Overcome task paralysis by committing to only 5 minutes with total permission to stop.',
    category: 'focus' as InterventionCategory,
    durationSeconds: 300,
    difficultyLevel: 'gentle' as const,
    order: 3,
    tags: ['focus', 'procrastination', 'study', 'work'],
    suitableForTriggers: ['cant_focus', 'overwhelmed'],
    steps: [
      {
        stepNumber: 1,
        title: 'Select the atomic micro-step',
        instruction: 'Do not aim to finish the project. Just open the notebook, read 1 paragraph, or write 1 line of code.',
        durationSeconds: 30,
      },
      {
        stepNumber: 2,
        title: 'Silence the environment',
        instruction: 'Turn phone face down or silence notifications for just these 5 minutes.',
        durationSeconds: 30,
      },
      {
        stepNumber: 3,
        title: 'Work on this single item',
        instruction: 'Focus only on this tiny slice. When the timer ends, you have full permission to walk away.',
        durationSeconds: 240,
      },
    ],
  },
  {
    slug: 'wind-down-478',
    title: '4-7-8 Rest & Wind-Down',
    shortDescription: 'Lower heart rate and prepare your body for peaceful rest or sleep.',
    category: 'rest' as InterventionCategory,
    durationSeconds: 180,
    difficultyLevel: 'gentle' as const,
    order: 4,
    tags: ['sleep', 'rest', 'night', 'winddown'],
    suitableForTriggers: ['cant_sleep', 'exhausted'],
    steps: [
      {
        stepNumber: 1,
        title: 'Settle into position',
        instruction: 'Lie comfortably on your back or rest in a soft chair. Relax your jaw and shoulders.',
        durationSeconds: 20,
      },
      {
        stepNumber: 2,
        title: 'Inhale through nose',
        instruction: 'Inhale quietly through your nose for 4 seconds.',
        durationSeconds: 4,
      },
      {
        stepNumber: 3,
        title: 'Hold the breath',
        instruction: 'Hold comfortably for 7 seconds.',
        durationSeconds: 7,
      },
      {
        stepNumber: 4,
        title: 'Exhale with whoosh sound',
        instruction: 'Exhale completely through your mouth for 8 seconds.',
        durationSeconds: 8,
      },
      {
        stepNumber: 5,
        title: 'Repeat soothing cycle',
        instruction: 'Continue this 4-7-8 rhythm gently without forcing.',
        durationSeconds: 140,
      },
    ],
  },
  {
    slug: 'physiological-sigh',
    title: 'Physiological Sigh',
    shortDescription: 'The fastest natural technique to pop open collapsed alveoli and lower acute physiological tension.',
    category: 'calm' as InterventionCategory,
    durationSeconds: 90,
    difficultyLevel: 'gentle' as const,
    order: 5,
    tags: ['anxiety', 'panic', 'quick', 'calm'],
    suitableForTriggers: ['anxious', 'overwhelmed'],
    steps: [
      {
        stepNumber: 1,
        title: 'Deep inhale + top-off sip',
        instruction: 'Take a deep inhale through your nose, then immediately take another sharp sip of air to fully expand your lungs.',
        durationSeconds: 5,
      },
      {
        stepNumber: 2,
        title: 'Long, slow sigh exhale',
        instruction: 'Let the breath fall out of your mouth in a long, unforced sigh until lungs are completely empty.',
        durationSeconds: 10,
      },
      {
        stepNumber: 3,
        title: 'Repeat 3 to 5 times',
        instruction: 'Cycle through double-inhale followed by the long sigh. Notice chest tension dissipating.',
        durationSeconds: 75,
      },
    ],
  },
  {
    slug: 'thought-dump',
    title: 'Brain Dump & Externalization',
    shortDescription: 'Move chaotic or racing thoughts out of your working memory and onto paper.',
    category: 'release' as InterventionCategory,
    durationSeconds: 240,
    difficultyLevel: 'gentle' as const,
    order: 6,
    tags: ['racing_thoughts', 'journal', 'release', 'overwhelm'],
    suitableForTriggers: ['racing_thoughts', 'overwhelmed', 'cant_sleep'],
    steps: [
      {
        stepNumber: 1,
        title: 'Unfiltered brain dump',
        instruction: 'Write or type everything tumbling in your mind. No punctuation, no grammar check, no filtering.',
        durationSeconds: 120,
      },
      {
        stepNumber: 2,
        title: 'Circle what is in your control today',
        instruction: 'Identify 1 thing you can act on today. Everything else belongs to tomorrow.',
        durationSeconds: 60,
      },
      {
        stepNumber: 3,
        title: 'Park the rest',
        instruction: 'Close the page. You have externalized the thoughts. They are stored safely and cannot escape.',
        durationSeconds: 60,
      },
    ],
  },
  {
    slug: 'micro-walk-hydration',
    title: 'Hydration & Posture Reset',
    shortDescription: 'Break physical freeze states with gentle hydration and skeletal alignment.',
    category: 'release' as InterventionCategory,
    durationSeconds: 150,
    difficultyLevel: 'gentle' as const,
    order: 7,
    tags: ['fatigue', 'physical', 'break', 'energy'],
    suitableForTriggers: ['low', 'cant_focus', 'exhausted'],
    steps: [
      {
        stepNumber: 1,
        title: 'Drink a full glass of water',
        instruction: 'Stand up, pour a glass of water, and drink it slowly, feeling the cool temperature.',
        durationSeconds: 40,
      },
      {
        stepNumber: 2,
        title: 'Roll shoulders & unclench jaw',
        instruction: 'Drop your shoulders away from your ears. Let your tongue rest off the roof of your mouth.',
        durationSeconds: 40,
      },
      {
        stepNumber: 3,
        title: 'Walk 20 paces',
        instruction: 'Take a short lap around the room or stretch your calves before returning.',
        durationSeconds: 70,
      },
    ],
  },
];

export const seedDefaultInterventions = async (): Promise<void> => {
  try {
    for (const item of DEFAULT_INTERVENTIONS) {
      await Intervention.findOneAndUpdate(
        { slug: item.slug },
        { $set: item },
        { upsert: true, new: true }
      );
    }
    logger.info(`Seeded ${DEFAULT_INTERVENTIONS.length} default interventions`);
  } catch (error) {
    logger.error('Error seeding interventions:', error);
  }
};

export interface InterventionFilters {
  category?: InterventionCategory;
  trigger?: string;
  maxDuration?: number;
}

export const listInterventions = async (
  filters?: InterventionFilters
): Promise<IIntervention[]> => {
  // Ensure default catalog is populated
  const count = await Intervention.countDocuments();
  if (count === 0) {
    await seedDefaultInterventions();
  }

  const query: any = { isActive: true };

  if (filters?.category) {
    query.category = filters.category;
  }
  if (filters?.trigger) {
    query.suitableForTriggers = filters.trigger;
  }
  if (filters?.maxDuration) {
    query.durationSeconds = { $lte: filters.maxDuration };
  }

  return Intervention.find(query).sort({ order: 1 });
};

export const getInterventionBySlug = async (
  slug: string
): Promise<IIntervention | null> => {
  return Intervention.findOne({ slug, isActive: true });
};

export const getInterventionById = async (
  id: string
): Promise<IIntervention | null> => {
  return Intervention.findById(id);
};

export const startInterventionSession = async (
  userId: string,
  interventionId: string,
  contextTrigger?: string
): Promise<IInterventionSession> => {
  const intervention = await Intervention.findById(interventionId);
  if (!intervention) {
    throw new Error('Intervention not found');
  }

  return InterventionSession.create({
    userId: new mongoose.Types.ObjectId(userId),
    interventionId: intervention._id,
    interventionSlug: intervention.slug,
    totalSteps: intervention.steps.length,
    completedSteps: 0,
    durationSpentSeconds: 0,
    contextTrigger,
    status: 'in_progress',
  });
};

export const completeInterventionSession = async (
  sessionId: string,
  completedSteps: number,
  durationSpentSeconds: number
): Promise<IInterventionSession | null> => {
  const session = await InterventionSession.findByIdAndUpdate(
    sessionId,
    {
      status: 'completed',
      completedSteps,
      durationSpentSeconds,
      completedAt: new Date(),
    },
    { new: true }
  );

  if (session) {
    // Automatically update today's gentle checklist milestone!
    const today = new Date().toISOString().split('T')[0];
    await DailyProgress.findOneAndUpdate(
      { userId: session.userId, date: today },
      { $set: { smallActionDone: true } },
      { upsert: true }
    );
  }

  return session;
};

export const abandonInterventionSession = async (
  sessionId: string,
  completedSteps: number,
  durationSpentSeconds: number
): Promise<IInterventionSession | null> => {
  return InterventionSession.findByIdAndUpdate(
    sessionId,
    {
      status: 'abandoned',
      completedSteps,
      durationSpentSeconds,
      completedAt: new Date(),
    },
    { new: true }
  );
};
