import { create } from 'zustand';
import { apiClient } from '../api/client';

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

export interface HelpfulStrategyItem {
  interventionSlug: string;
  name: string;
  score: number; // 1 to 10
  totalSessions: number;
}

export interface UserPatterns {
  sleepEnergy: SleepEnergyCorrelation;
  overwhelmContext: OverwhelmContextPattern;
  timeOfDayRhythms: TimeOfDayPattern;
  helpfulStrategies: HelpfulStrategyItem[];
  playbooks: PersonalPlaybook[];
  disclaimer: string;
}

interface PatternState {
  patterns: UserPatterns | null;
  playbooks: PersonalPlaybook[];
  isLoading: boolean;
  error: string | null;

  fetchPatterns: () => Promise<void>;
}

export const usePatternStore = create<PatternState>((set) => ({
  patterns: null,
  playbooks: [],
  isLoading: false,
  error: null,

  fetchPatterns: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.get('/patterns');
      const patterns: UserPatterns = res.data.patterns;
      set({
        patterns,
        playbooks: patterns.playbooks || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Could not load patterns',
        isLoading: false,
      });
    }
  },
}));
