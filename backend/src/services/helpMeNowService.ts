import { TriageTrigger } from '../models/TriageLog';

export interface TriageOption {
  id: 'talk' | 'calm' | 'journal' | 'focus' | 'human_support';
  label: string;
  description: string;
  isEmergency?: boolean;
}

export interface TriageResponse {
  headline: string;
  subtext: string;
  options: TriageOption[];
}

export const getTriageOptions = (trigger: TriageTrigger): TriageResponse => {
  switch (trigger) {
    case 'anxious':
      return {
        headline: "I'm here. Let's take the pressure down.",
        subtext: 'Anxiety creates false urgency in your body. We will focus on just the next 2 minutes.',
        options: [
          { id: 'calm', label: 'Calm down (2-min Grounding)', description: '5-4-3-2-1 sensory reset to steady your breath' },
          { id: 'talk', label: 'Talk about it', description: 'Walk through what feels scary right now' },
          { id: 'journal', label: 'Write it down', description: 'Get the thoughts out of your head onto paper' },
          { id: 'human_support', label: 'Get human support', description: 'Immediate confidential emotional hotline', isEmergency: true },
        ],
      };

    case 'racing_thoughts':
      return {
        headline: 'Your head is carrying too much right now.',
        subtext: "When thoughts are bouncing, trying to think your way out rarely works. Let's externalize them.",
        options: [
          { id: 'journal', label: 'Get my thoughts out (Brain dump)', description: 'Empty your mind into a private journal' },
          { id: 'calm', label: 'Sensory reset (2-min Grounding)', description: 'Shift awareness to what is around you' },
          { id: 'talk', label: 'Talk with MindOS', description: 'Unpack one thought at a time' },
          { id: 'human_support', label: 'Get human support', description: 'Talk to a compassionate listener', isEmergency: true },
        ],
      };

    case 'overwhelmed':
      return {
        headline: "I'm here. Let's deal with just the next few minutes.",
        subtext: "Overwhelm happens when we try to solve everything at once. We don't need to fix everything right now.",
        options: [
          { id: 'talk', label: 'Talk about it', description: 'Let MindOS help simplify the noise' },
          { id: 'focus', label: 'Help me focus (Start 5 min)', description: 'Narrow in on just one tiny micro-step' },
          { id: 'calm', label: 'Calm down', description: 'A quiet 2-minute reset before deciding anything' },
          { id: 'journal', label: 'Get my thoughts out', description: 'Write it down privately' },
          { id: 'human_support', label: 'Get human support', description: 'Connect with a human counselor', isEmergency: true },
        ],
      };

    case 'cant_focus':
      return {
        headline: "Focus isn't about willpower. Let's make it easier.",
        subtext: 'Your brain is having trouble initiating. We make the doorway smaller.',
        options: [
          { id: 'focus', label: 'Help me focus (5-minute session)', description: 'Only commit to the first 5 minutes' },
          { id: 'talk', label: 'Talk it through', description: 'Identify what is blocking task start' },
          { id: 'calm', label: 'Clear the mental slate', description: 'A quick physical or breathing reset' },
        ],
      };

    case 'low':
      return {
        headline: 'It is okay to feel low today.',
        subtext: "You don't need to force yourself to be productive or cheerful. Be kind to where you are.",
        options: [
          { id: 'talk', label: 'Talk about it', description: 'A gentle, safe ear without judgment' },
          { id: 'journal', label: 'Write privately in Journal', description: 'Let your feelings rest on the page' },
          { id: 'calm', label: 'Quiet rest', description: 'Low-effort restorative breathing' },
          { id: 'human_support', label: 'Get human support', description: 'Direct human support in Bangladesh', isEmergency: true },
        ],
      };

    case 'cant_sleep':
      return {
        headline: 'Let your body relax, even if sleep is stubborn.',
        subtext: 'Resting with eyes closed is still nourishing. Release the pressure to fall asleep immediately.',
        options: [
          { id: 'calm', label: '4-7-8 Sleep Wind-down', description: 'Lower your nervous system activity' },
          { id: 'journal', label: 'Park your thoughts', description: 'Write down worries so you can revisit them tomorrow' },
          { id: 'talk', label: 'Talk quietly with MindOS', description: 'Gentle, soothing conversation' },
        ],
      };

    case 'lonely':
      return {
        headline: 'Feeling disconnected is heavy. You are not alone.',
        subtext: 'Even a small connection or expressing what you feel can ease the weight.',
        options: [
          { id: 'talk', label: 'Talk with MindOS', description: 'I am right here to listen and keep you company' },
          { id: 'journal', label: 'Express your feelings privately', description: 'Safe space to explore what is missing' },
          { id: 'human_support', label: 'Reach human support', description: 'Trained emotional care specialists', isEmergency: true },
        ],
      };

    case 'dont_know':
    default:
      return {
        headline: "You don't have to know exactly what is wrong.",
        subtext: "Sometimes it just feels 'off' or heavy. That is completely normal. Let's pause together.",
        options: [
          { id: 'calm', label: 'Take a 2-minute breather', description: 'No decisions, just gentle rhythm' },
          { id: 'talk', label: 'Talk about it freely', description: 'Say anything that comes to mind' },
          { id: 'journal', label: 'Private journal', description: 'Put whatever comes up onto the screen' },
          { id: 'human_support', label: 'Get human support', description: 'Talk with someone directly', isEmergency: true },
        ],
      };
  }
};

export const getCrisisResources = () => {
  return [
    {
      country: 'Bangladesh',
      name: 'Kaan Pete Roi (Emotional Support & Suicide Prevention)',
      phone: '+8801779554391',
      details: 'First emotional support and suicide prevention helpline in Bangladesh. Confidential and compassionate.',
      available: 'Daily 3:00 PM - 3:00 AM (BDT)',
    },
    {
      country: 'Bangladesh',
      name: 'National Emergency Service (Police / Ambulance)',
      phone: '999',
      details: '24/7 government emergency response service across Bangladesh.',
      available: '24/7',
    },
    {
      country: 'Bangladesh',
      name: 'National Institute of Mental Health (NIMH) Dhaka',
      phone: '+88029118171',
      details: 'Specialized psychiatric and mental health institute located in Sher-e-Bangla Nagar, Dhaka.',
      available: 'Hospital operating hours',
    },
    {
      country: 'International',
      name: 'Befrienders Worldwide',
      phone: 'https://www.befrienders.org',
      details: 'Global network of crisis centers providing confidential support worldwide.',
      available: '24/7',
    },
  ];
};
