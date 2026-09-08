import { create } from 'zustand';
import { apiClient } from '../api/client';
import { getCache, setCache, CACHE_KEYS } from '../utils/offlineCache';
import { enqueue } from '../utils/syncQueue';

export type Mood = 'great' | 'neutral' | 'down' | 'overwhelmed' | 'exhausted';

export interface NextStep {
  title: string;
  context: string;
  actionLabel: string;
  actionType: 'task_breakdown' | 'breathing' | 'talk' | 'journal' | 'focus' | 'checkin';
  durationMinutes: number;
  interventionSlug?: string;
  personalizationReasoning?: string;
}

export interface TodayCheckin {
  _id: string;
  mood: Mood;
  tags: string[];
  note?: string;
  date: string;
}

export interface DailyChecklist {
  checkin: boolean;
  smallAction: boolean;
  eveningReflection: boolean;
}

interface HomeState {
  greeting: string;
  todayCheckin: TodayCheckin | null;
  nextStep: NextStep | null;
  checklist: DailyChecklist;
  isLoading: boolean;
  isSubmittingCheckin: boolean;
  error: string | null;

  fetchHomeFeed: () => Promise<void>;
  submitCheckin: (mood: Mood, tags?: string[], note?: string) => Promise<void>;
  toggleChecklist: (item: 'smallAction' | 'eveningReflection') => Promise<void>;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  greeting: 'Good morning 👋',
  todayCheckin: null,
  nextStep: null,
  checklist: {
    checkin: false,
    smallAction: false,
    eveningReflection: false,
  },
  isLoading: false,
  isSubmittingCheckin: false,
  error: null,

  fetchHomeFeed: async () => {
    // SWR Step 1: Load from cache immediately for instant display
    const cached = await getCache<{
      greeting: string;
      todayCheckin: TodayCheckin | null;
      nextStep: NextStep | null;
      checklist: DailyChecklist;
    }>(CACHE_KEYS.HOME_FEED);

    if (cached) {
      set({
        greeting: cached.greeting,
        todayCheckin: cached.todayCheckin,
        nextStep: cached.nextStep,
        checklist: cached.checklist,
        isLoading: false,
      });
    } else {
      set({ isLoading: true, error: null });
    }

    // SWR Step 2: Background revalidation from server
    try {
      const res = await apiClient.get('/checkin/home-feed');
      const { greeting, todayCheckin, nextStep, checklist } = res.data;

      // Write fresh data to cache (TTL: 6 hours)
      await setCache(CACHE_KEYS.HOME_FEED, { greeting, todayCheckin, nextStep, checklist }, 6 * 60 * 60 * 1000);

      set({
        greeting,
        todayCheckin,
        nextStep,
        checklist,
        isLoading: false,
        error: null,
      });
    } catch {
      // Network unavailable — silently retain cached data
      set({ isLoading: false });
    }
  },

  submitCheckin: async (mood, tags = [], note = '') => {
    set({ isSubmittingCheckin: true, error: null });

    const today = new Date().toISOString().split('T')[0];
    const clientTimestamp = new Date().toISOString();

    try {
      const res = await apiClient.post('/checkin', { mood, tags, note });
      const { checkin, nextStep } = res.data;

      set((state) => ({
        todayCheckin: checkin,
        nextStep,
        checklist: {
          ...state.checklist,
          checkin: true,
        },
        isSubmittingCheckin: false,
      }));
    } catch {
      // Offline: queue for later batch sync, apply optimistic UI update
      await enqueue({
        type: 'CHECKIN',
        payload: { mood, energyLevel: undefined, tags, note, date: today, clientTimestamp },
      });

      // Optimistic update so UI feels responsive
      set((state) => ({
        todayCheckin: {
          _id: `offline_${Date.now()}`,
          mood,
          tags: tags ?? [],
          note,
          date: today,
        },
        checklist: {
          ...state.checklist,
          checkin: true,
        },
        isSubmittingCheckin: false,
      }));
    }
  },

  toggleChecklist: async (item) => {
    const current = get().checklist[item];
    const newStatus = !current;

    // Optimistic UI update
    set((state) => ({
      checklist: {
        ...state.checklist,
        [item]: newStatus,
      },
    }));

    try {
      const res = await apiClient.post('/checkin/checklist/toggle', {
        item,
        completed: newStatus,
      });
      set({ checklist: res.data.checklist });
    } catch {
      // Rollback on failure
      set((state) => ({
        checklist: {
          ...state.checklist,
          [item]: current,
        },
      }));
    }
  },
}));
