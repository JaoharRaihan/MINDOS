import {
  AIService,
  ExtractedSignals,
  GenerateResponseParams,
  AICompanionResponse,
  extractedSignalsSchema,
} from './AIService';

export class MindOSAIProvider implements AIService {
  async extractSignals(text: string, context?: any): Promise<ExtractedSignals> {
    const lower = text.toLowerCase();

    // 1. Study / Task initiation in Banglish or English
    if (
      lower.includes('porte boshte partesi na') ||
      lower.includes('mathay onk kichu') ||
      lower.includes('procrastinat') ||
      lower.includes("can't start") ||
      lower.includes('cant start') ||
      lower.includes('exam')
    ) {
      return extractedSignalsSchema.parse({
        emotion: 'overwhelmed',
        context: 'exam_study_pressure',
        difficulty: 'task_initiation',
        userGoal: 'study',
        urgency: 'moderate',
        preferredSupport: 'short_practical',
      });
    }

    // 2. Family expectations
    if (
      lower.includes('family') ||
      lower.includes('biye') ||
      lower.includes('baba') ||
      lower.includes('ma') ||
      lower.includes('expectation')
    ) {
      return extractedSignalsSchema.parse({
        emotion: 'pressured',
        context: 'family_social_expectations',
        difficulty: 'emotional_churn',
        userGoal: 'peace_of_mind',
        urgency: 'moderate',
        preferredSupport: 'empathetic_listener',
      });
    }

    // 3. Career / Job uncertainty
    if (
      lower.includes('chakri') ||
      lower.includes('job') ||
      lower.includes('career') ||
      lower.includes('future') ||
      lower.includes('tension')
    ) {
      return extractedSignalsSchema.parse({
        emotion: 'anxious',
        context: 'career_uncertainty',
        difficulty: 'racing_thoughts',
        userGoal: 'clarity',
        urgency: 'moderate',
        preferredSupport: 'grounding_and_focus',
      });
    }

    // 4. Sleep & Fatigue
    if (
      lower.includes('ghum') ||
      lower.includes('sleep') ||
      lower.includes('tired') ||
      lower.includes('klanto')
    ) {
      return extractedSignalsSchema.parse({
        emotion: 'exhausted',
        context: 'sleep_deprivation',
        difficulty: 'physical_mental_fatigue',
        userGoal: 'rest',
        urgency: 'low',
        preferredSupport: 'low_stimulation_wind_down',
      });
    }

    // Default signals
    return extractedSignalsSchema.parse({
      emotion: 'seeking_support',
      context: 'general_wellbeing',
      difficulty: 'processing_feelings',
      userGoal: 'feel_better',
      urgency: 'low',
      preferredSupport: 'reflective_dialogue',
    });
  }

  async generateResponse(params: GenerateResponseParams): Promise<AICompanionResponse> {
    const signals = await this.extractSignals(params.message);
    const { emotion, difficulty, context } = signals;

    // Build tailored response adhering to MindOS philosophy:
    // "You seem to...", "Would you like to try...?", zero diagnostic jargon.
    let replyText = '';
    let options: string[] = ['Start 5 min', 'Just talk'];
    let suggestedActions: Array<{ label: string; actionType: string; payload?: string }> = [];

    if (difficulty === 'task_initiation') {
      replyText =
        "You've got an exam or work coming up, and it sounds like getting started feels harder than the actual studying. Want me to help you make the first 5 minutes easier?";
      options = ['Yes, let’s do 5 min', 'Just talk', 'Take a 2-min breather'];
      suggestedActions = [
        { label: 'Start 5 min', actionType: 'task_breakdown', payload: '5_min_study' },
        { label: 'Just talk', actionType: 'chat' },
      ];
    } else if (context === 'family_social_expectations') {
      replyText =
        "Balancing expectations with what you feel inside can take a lot out of you. You don't have to resolve everything right now. Would you like to unpack what's feeling hardest?";
      options = ['Talk about it', 'Calm down first', 'Not right now'];
      suggestedActions = [
        { label: 'Talk about it', actionType: 'chat' },
        { label: 'Calm down first', actionType: 'breathing', payload: 'grounding' },
      ];
    } else if (context === 'career_uncertainty') {
      replyText =
        "Career and future questions can feel like a constant background noise in your head. Let's deal with just the next few moments. What feels easiest to do right now?";
      options = ['Talk it out', 'Focus on 1 small task', '2-min grounding'];
      suggestedActions = [
        { label: 'Focus on 1 task', actionType: 'task_breakdown', payload: '1_task' },
        { label: '2-min grounding', actionType: 'breathing', payload: 'grounding' },
      ];
    } else if (context === 'sleep_deprivation') {
      replyText =
        'It sounds like your mind isn’t letting your body rest easily tonight. When sleep is elusive, pushing yourself harder rarely helps. Would you like to try a low-stimulation wind-down?';
      options = ['Try wind-down', 'Just listen', 'Quiet thoughts'];
      suggestedActions = [
        { label: 'Try wind-down', actionType: 'breathing', payload: '4_7_8_winddown' },
      ];
    } else {
      replyText =
        "I'm here with you. We don't have to rush to fix anything immediately. Would you like to talk through what feels on your mind, or do something small to reset?";
      options = ['Talk about it', 'Do something small', 'Just take 2 minutes'];
      suggestedActions = [
        { label: 'Talk about it', actionType: 'chat' },
        { label: 'Do something small', actionType: 'task_breakdown' },
      ];
    }

    return {
      text: replyText,
      options,
      suggestedActions,
      signals,
    };
  }

  async classifySafety(text: string): Promise<{ isSafe: boolean; category?: string; severity: 'low' | 'moderate' | 'high' }> {
    const lower = text.toLowerCase();
    if (
      lower.includes('kill myself') ||
      lower.includes('suicide') ||
      lower.includes('end my life') ||
      lower.includes('mora jete chai')
    ) {
      return {
        isSafe: false,
        category: 'self_harm',
        severity: 'high',
      };
    }

    return {
      isSafe: true,
      severity: 'low',
    };
  }
}
