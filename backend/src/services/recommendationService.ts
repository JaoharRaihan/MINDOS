import { MoodType, ICheckin } from '../models/Checkin';
import { ISupportProfile } from '../models/SupportProfile';

export interface NextStepRecommendation {
  title: string;
  context: string;
  actionLabel: string;
  actionType: 'task_breakdown' | 'breathing' | 'talk' | 'journal' | 'focus' | 'checkin';
  durationMinutes: number;
}

export const getNextStepRecommendation = (
  checkin: ICheckin | null,
  profile: ISupportProfile | null
): NextStepRecommendation => {
  if (!checkin) {
    return {
      title: 'How are you feeling right now?',
      context: 'Take 30 seconds to notice where your mind is before diving into the day.',
      actionLabel: 'Check in now',
      actionType: 'checkin',
      durationMinutes: 1,
    };
  }

  const tags = checkin.tags || [];
  const hasStudyTag = tags.includes('study') || tags.includes('academic');
  const hasWorkTag = tags.includes('work') || tags.includes('career');

  switch (checkin.mood) {
    case 'overwhelmed':
      if (hasStudyTag || hasWorkTag) {
        return {
          title: "Let's make starting easier.",
          context: 'You mentioned feeling overwhelmed with your studies/work. The first 5 minutes are the hardest part.',
          actionLabel: 'Start 5 min',
          actionType: 'task_breakdown',
          durationMinutes: 5,
        };
      }
      return {
        title: 'Step back for just a moment.',
        context: 'When everything feels loud at once, we narrow our focus to just the next 5 minutes.',
        actionLabel: '2-min Grounding',
        actionType: 'breathing',
        durationMinutes: 2,
      };

    case 'exhausted':
      return {
        title: 'A low-stimulation reset.',
        context: 'Your battery is low right now. Let’s do a gentle wind-down or hydration check before pushing further.',
        actionLabel: '3-min Rest',
        actionType: 'breathing',
        durationMinutes: 3,
      };

    case 'down':
      return {
        title: 'Be gentle with yourself.',
        context: "You don't need to fix everything today. Would you like to get your thoughts out privately?",
        actionLabel: 'Explore in Journal',
        actionType: 'journal',
        durationMinutes: 5,
      };

    case 'great':
      return {
        title: 'Ride this clear momentum.',
        context: 'You have clarity right now. Pick one meaningful thing you care about and give it your focus.',
        actionLabel: 'Start Focus',
        actionType: 'focus',
        durationMinutes: 15,
      };

    case 'neutral':
    default:
      return {
        title: 'One small action.',
        context: 'A steady day is built from small, calm choices. What would feel good to do next?',
        actionLabel: 'Start 5 min',
        actionType: 'task_breakdown',
        durationMinutes: 5,
      };
  }
};
