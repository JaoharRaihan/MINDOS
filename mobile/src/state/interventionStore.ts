import { create } from 'zustand';
import { apiClient } from '../api/client';
import { useFeedbackStore } from './feedbackStore';

export type InterventionCategory = 'calm' | 'focus' | 'grounding' | 'release' | 'rest';

export interface InterventionStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationSeconds?: number;
}

export interface Intervention {
  _id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: InterventionCategory;
  durationSeconds: number;
  difficultyLevel: 'gentle' | 'moderate';
  steps: InterventionStep[];
  tags: string[];
  suitableForTriggers: string[];
  order: number;
}

export interface InterventionSession {
  _id: string;
  interventionId: string;
  interventionSlug: string;
  startedAt: string;
  completedAt?: string;
  completedSteps: number;
  totalSteps: number;
  durationSpentSeconds: number;
  contextTrigger?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
}

interface InterventionState {
  interventions: Intervention[];
  activeIntervention: Intervention | null;
  activeSession: InterventionSession | null;
  currentStepIndex: number;
  timeRemainingSeconds: number;
  isTimerRunning: boolean;
  isPlayerOpen: boolean;
  isLoading: boolean;
  error: string | null;

  fetchInterventions: (filters?: { category?: string; trigger?: string }) => Promise<void>;
  startIntervention: (intervention: Intervention, contextTrigger?: string) => Promise<void>;
  startBySlug: (slug: string, contextTrigger?: string) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  toggleTimer: () => void;
  tickTimer: () => void;
  completeActiveSession: () => Promise<void>;
  abandonActiveSession: () => Promise<void>;
  closePlayer: () => void;
}

export const useInterventionStore = create<InterventionState>((set, get) => ({
  interventions: [],
  activeIntervention: null,
  activeSession: null,
  currentStepIndex: 0,
  timeRemainingSeconds: 0,
  isTimerRunning: false,
  isPlayerOpen: false,
  isLoading: false,
  error: null,

  fetchInterventions: async (filters) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.get('/interventions', { params: filters });
      set({
        interventions: res.data.interventions || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch interventions',
        isLoading: false,
      });
    }
  },

  startIntervention: async (intervention: Intervention, contextTrigger?: string) => {
    try {
      set({ isLoading: true, error: null });

      const res = await apiClient.post('/interventions/start', {
        interventionId: intervention._id,
        contextTrigger,
      });

      const initialDuration = intervention.steps[0]?.durationSeconds || 30;

      set({
        activeIntervention: intervention,
        activeSession: res.data.session,
        currentStepIndex: 0,
        timeRemainingSeconds: initialDuration,
        isTimerRunning: true,
        isPlayerOpen: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to start intervention session',
        isLoading: false,
      });
    }
  },

  startBySlug: async (slug: string, contextTrigger?: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.get(`/interventions/${slug}`);
      const intervention = res.data.intervention;
      if (intervention) {
        await get().startIntervention(intervention, contextTrigger);
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to launch intervention',
        isLoading: false,
      });
    }
  },

  nextStep: () => {
    const { activeIntervention, currentStepIndex } = get();
    if (!activeIntervention) return;

    if (currentStepIndex < activeIntervention.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStepDuration =
        activeIntervention.steps[nextIndex]?.durationSeconds || 30;
      set({
        currentStepIndex: nextIndex,
        timeRemainingSeconds: nextStepDuration,
        isTimerRunning: true,
      });
    } else {
      get().completeActiveSession();
    }
  },

  prevStep: () => {
    const { activeIntervention, currentStepIndex } = get();
    if (!activeIntervention || currentStepIndex === 0) return;

    const prevIndex = currentStepIndex - 1;
    const prevDuration = activeIntervention.steps[prevIndex]?.durationSeconds || 30;
    set({
      currentStepIndex: prevIndex,
      timeRemainingSeconds: prevDuration,
      isTimerRunning: true,
    });
  },

  toggleTimer: () => {
    set((state) => ({ isTimerRunning: !state.isTimerRunning }));
  },

  tickTimer: () => {
    const { timeRemainingSeconds, isTimerRunning } = get();
    if (!isTimerRunning) return;

    if (timeRemainingSeconds > 0) {
      set({ timeRemainingSeconds: timeRemainingSeconds - 1 });
    }
  },

  completeActiveSession: async () => {
    const { activeSession, activeIntervention } = get();
    if (!activeSession || !activeIntervention) return;

    const sessionId = activeSession._id;
    const title = activeIntervention.title;
    const slug = activeIntervention.slug;

    try {
      await apiClient.post('/interventions/complete', {
        sessionId,
        completedSteps: activeIntervention.steps.length,
        durationSpentSeconds: activeIntervention.durationSeconds,
      });

      set({
        isTimerRunning: false,
        isPlayerOpen: false,
        activeIntervention: null,
        activeSession: null,
      });

      // Trigger "Did It Help?" feedback loop!
      useFeedbackStore.getState().openFeedback(sessionId, title, slug);
    } catch (err) {
      console.warn('Failed to complete session:', err);
      set({ isPlayerOpen: false });
    }
  },

  abandonActiveSession: async () => {
    const { activeSession, currentStepIndex, activeIntervention } = get();
    if (activeSession) {
      try {
        await apiClient.post('/interventions/abandon', {
          sessionId: activeSession._id,
          completedSteps: currentStepIndex,
          durationSpentSeconds: 30 * currentStepIndex,
        });
      } catch (err) {
        console.warn('Failed to abandon session:', err);
      }
    }

    set({
      isTimerRunning: false,
      isPlayerOpen: false,
      activeIntervention: null,
      activeSession: null,
    });
  },

  closePlayer: () => {
    get().abandonActiveSession();
  },
}));
