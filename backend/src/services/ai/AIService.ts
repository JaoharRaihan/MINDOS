import { z } from 'zod';

export const extractedSignalsSchema = z.object({
  emotion: z.string(),
  context: z.string(),
  difficulty: z.string(),
  userGoal: z.string().optional(),
  urgency: z.enum(['low', 'moderate', 'high', 'crisis']),
  preferredSupport: z.string(),
});

export type ExtractedSignals = z.infer<typeof extractedSignalsSchema>;

export interface GenerateResponseParams {
  message: string;
  userPreferredName?: string;
  communicationTone: 'gentle' | 'practical' | 'casual';
  recentMood?: string;
  recentCheckinTags?: string[];
  recentMemories?: string[];
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AICompanionResponse {
  text: string;
  options: string[];
  suggestedActions?: Array<{
    label: string;
    actionType: string;
    payload?: string;
  }>;
  signals: ExtractedSignals;
}

export interface AIService {
  extractSignals(text: string, context?: any): Promise<ExtractedSignals>;
  generateResponse(params: GenerateResponseParams): Promise<AICompanionResponse>;
  classifySafety(text: string): Promise<{ isSafe: boolean; category?: string; severity: 'low' | 'moderate' | 'high' }>;
}
