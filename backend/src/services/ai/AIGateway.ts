import { AIService, AICompanionResponse } from './AIService';
import { MindOSAIProvider } from './MindOSAIProvider';
import { IUser } from '../../models/User';
import { Checkin } from '../../models/Checkin';
import { SupportProfile } from '../../models/SupportProfile';
import { Memory } from '../../models/Memory';
import {
  evaluateInputSafety,
  filterOutputSafety,
  logSafetyEvent,
} from '../safetyService';

export class AIGateway {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || new MindOSAIProvider();
  }

  public setAIService(service: AIService): void {
    this.aiService = service;
  }

  async processUserMessage(params: {
    user: IUser;
    message: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<AICompanionResponse> {
    const { user, message, conversationHistory = [] } = params;

    // 1. Safety Classification Pipeline (Self-harm crisis and medical diagnosis guardrails)
    const safety = evaluateInputSafety(message);
    if (!safety.isSafe) {
      if (safety.category === 'self_harm' && safety.crisisResponse) {
        await logSafetyEvent(
          user._id.toString(),
          'self_harm',
          'crisis',
          'crisis_redirect',
          safety.matchedRule
        );
        return {
          text: safety.crisisResponse.text,
          options: safety.crisisResponse.options,
          suggestedActions: safety.crisisResponse.suggestedActions,
          signals: {
            emotion: 'crisis',
            context: 'self_harm_risk',
            difficulty: 'crisis_intervention',
            urgency: 'crisis',
            preferredSupport: 'human_support',
          },
        };
      }

      if (safety.category === 'medical_diagnosis' && safety.clinicalBoundaryResponse) {
        await logSafetyEvent(
          user._id.toString(),
          'medical_diagnosis',
          'caution',
          'clinical_boundary_disclaimer',
          safety.matchedRule
        );
        return {
          text: safety.clinicalBoundaryResponse.text,
          options: safety.clinicalBoundaryResponse.options,
          suggestedActions: safety.clinicalBoundaryResponse.suggestedActions,
          signals: {
            emotion: 'seeking_clarity',
            context: 'medical_inquiry',
            difficulty: 'clinical_boundary_disclaimer',
            urgency: 'moderate',
            preferredSupport: 'non_clinical_reassurance',
          },
        };
      }
    }

    // 2. Context retrieval & User Memories
    const todayDate = new Date().toISOString().split('T')[0];
    const [todayCheckin, supportProfile, activeMemories] = await Promise.all([
      Checkin.findOne({ userId: user._id, date: todayDate }),
      SupportProfile.findOne({ userId: user._id }),
      user.privacySettings?.aiMemoryEnabled !== false
        ? Memory.find({ userId: user._id, isActive: true }).limit(5)
        : Promise.resolve([]),
    ]);

    const communicationTone =
      supportProfile?.communicationPreferences?.tone || user.communicationTone || 'practical';

    // 3. Response generation via replaceable AI provider
    const response = await this.aiService.generateResponse({
      message,
      userPreferredName: user.preferredName || user.name,
      communicationTone,
      recentMood: todayCheckin?.mood,
      recentCheckinTags: todayCheckin?.tags || [],
      recentMemories: activeMemories.map((m) => m.content),
      conversationHistory,
    });

    // 4. Output Guardrail (Ensures model never asserts clinical diagnoses)
    const filtered = filterOutputSafety(response.text);
    if (filtered.wasModified) {
      await logSafetyEvent(
        user._id.toString(),
        'medical_diagnosis',
        'caution',
        'output_redacted',
        filtered.ruleTriggered
      );
      response.text = filtered.text;
    }

    return response;
  }
}

export const defaultAIGateway = new AIGateway();
