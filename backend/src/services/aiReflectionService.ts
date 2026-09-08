import { IAIReflection } from '../models/Journal';

export const generateAIReflection = (content: string): IAIReflection => {
  const text = content.toLowerCase();

  // Banglish / Contextual pattern matching for instant, responsive reflections
  if (
    text.includes('kharap lagtesilo') ||
    text.includes('kawke bolteo iccha') ||
    text.includes('karon chara mon kharap')
  ) {
    return {
      text: "It sounds like you were feeling low and didn't really want to talk to anyone today.",
      suggestedExploration: 'Would you like to explore what made today feel difficult?',
      generatedAt: new Date(),
    };
  }

  if (
    text.includes('porte boshte partesi na') ||
    text.includes('mathay onk kichu') ||
    text.includes('procrastinat') ||
    text.includes('cant start') ||
    text.includes("can't start")
  ) {
    return {
      text: "It sounds like the pressure to start is feeling heavier than the work itself.",
      suggestedExploration: 'Would you like to break this down into just a 5-minute easy step?',
      generatedAt: new Date(),
    };
  }

  if (
    text.includes('family') ||
    text.includes('baba') ||
    text.includes('ma') ||
    text.includes('pressure') ||
    text.includes('expectation')
  ) {
    return {
      text: 'Balancing expectations with what you feel inside can take a lot out of you.',
      suggestedExploration: 'Would you like to take a quiet moment to breathe and reset?',
      generatedAt: new Date(),
    };
  }

  if (
    text.includes('chakri') ||
    text.includes('job') ||
    text.includes('career') ||
    text.includes('future') ||
    text.includes('tension')
  ) {
    return {
      text: 'Uncertainty about what lies ahead can feel constantly on your mind.',
      suggestedExploration: 'Would you like to focus on just one small thing you control today?',
      generatedAt: new Date(),
    };
  }

  if (
    text.includes('ghum') ||
    text.includes('sleep') ||
    text.includes('tired') ||
    text.includes('klanto')
  ) {
    return {
      text: 'It sounds like your body and mind are carrying a lot of fatigue right now.',
      suggestedExploration: 'Would you like to try a low-stimulation wind-down?',
      generatedAt: new Date(),
    };
  }

  // Gentle default reflection adhering strictly to MindOS non-clinical philosophy
  return {
    text: 'Thank you for giving your thoughts a safe place to land. Giving words to what you feel is an important step.',
    suggestedExploration: 'Would you like to explore this more, or just let it rest here for now?',
    generatedAt: new Date(),
  };
};
