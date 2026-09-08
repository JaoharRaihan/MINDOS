import { create } from 'zustand';
import { apiClient } from '../api/client';

export type TriageTrigger =
  | 'anxious'
  | 'racing_thoughts'
  | 'overwhelmed'
  | 'cant_focus'
  | 'low'
  | 'cant_sleep'
  | 'lonely'
  | 'dont_know';

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

export interface CrisisResource {
  country: string;
  name: string;
  phone: string;
  details: string;
  available: string;
}

interface HelpState {
  activeTrigger: TriageTrigger | null;
  triageData: TriageResponse | null;
  currentLogId: string | null;
  crisisResources: CrisisResource[];
  isLoadingTriage: boolean;
  isLoadingResources: boolean;
  error: string | null;

  selectTrigger: (trigger: TriageTrigger) => Promise<void>;
  fetchResources: () => Promise<void>;
  logAction: (actionId: 'talk' | 'calm' | 'journal' | 'focus' | 'human_support') => Promise<void>;
  resetTriage: () => void;
}

export const useHelpStore = create<HelpState>((set, get) => ({
  activeTrigger: null,
  triageData: null,
  currentLogId: null,
  crisisResources: [],
  isLoadingTriage: false,
  isLoadingResources: false,
  error: null,

  resetTriage: () =>
    set({
      activeTrigger: null,
      triageData: null,
      currentLogId: null,
      error: null,
    }),

  selectTrigger: async (trigger: TriageTrigger) => {
    try {
      set({
        activeTrigger: trigger,
        isLoadingTriage: true,
        error: null,
      });

      const res = await apiClient.post('/help/triage', { trigger });

      set({
        triageData: res.data.triage,
        currentLogId: res.data.logId,
        isLoadingTriage: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to initialize acute triage',
        isLoadingTriage: false,
      });
    }
  },

  fetchResources: async () => {
    try {
      set({ isLoadingResources: true, error: null });
      const res = await apiClient.get('/help/resources');
      set({
        crisisResources: res.data.resources || [],
        isLoadingResources: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch emergency resources',
        isLoadingResources: false,
      });
    }
  },

  logAction: async (actionId: 'talk' | 'calm' | 'journal' | 'focus' | 'human_support') => {
    try {
      const { currentLogId, activeTrigger } = get();
      await apiClient.post('/help/log-action', {
        logId: currentLogId || undefined,
        trigger: activeTrigger || undefined,
        chosenAction: actionId,
      });
    } catch (err) {
      console.warn('Failed to log triage action:', err);
    }
  },
}));
