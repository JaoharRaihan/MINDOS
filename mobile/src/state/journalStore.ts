import { create } from 'zustand';
import { apiClient } from '../api/client';
import { getCache, setCache, CACHE_KEYS } from '../utils/offlineCache';
import { enqueue } from '../utils/syncQueue';

export interface AIReflection {
  text: string;
  suggestedExploration?: string;
  generatedAt: string;
}

export interface JournalEntry {
  _id: string;
  content: string;
  type: 'text' | 'voice';
  audioDurationSeconds?: number;
  aiReflection?: AIReflection;
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
}

interface JournalState {
  entries: JournalEntry[];
  activeReflection: AIReflection | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchEntries: () => Promise<void>;
  createEntry: (content: string, type?: 'text' | 'voice') => Promise<JournalEntry>;
  deleteEntry: (id: string) => Promise<void>;
  clearActiveReflection: () => void;
}

export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  activeReflection: null,
  isLoading: false,
  isSaving: false,
  error: null,

  clearActiveReflection: () => set({ activeReflection: null }),

  fetchEntries: async () => {
    // SWR Step 1: Serve cached entries instantly
    const cached = await getCache<JournalEntry[]>(CACHE_KEYS.JOURNAL_ENTRIES);
    if (cached) {
      set({ entries: cached, isLoading: false });
    } else {
      set({ isLoading: true, error: null });
    }

    // SWR Step 2: Background revalidation
    try {
      const res = await apiClient.get('/journal');
      const fresh: JournalEntry[] = res.data.entries;
      await setCache(CACHE_KEYS.JOURNAL_ENTRIES, fresh, 12 * 60 * 60 * 1000); // 12h TTL
      set({ entries: fresh, isLoading: false, error: null });
    } catch {
      // Offline — silently keep cached list visible
      set({ isLoading: false });
    }
  },

  createEntry: async (content, type = 'text') => {
    set({ isSaving: true, error: null });
    const clientTimestamp = new Date().toISOString();

    try {
      const res = await apiClient.post('/journal', { content, type });
      const newEntry = res.data.entry;

      set((state) => ({
        entries: [newEntry, ...state.entries],
        activeReflection: newEntry.aiReflection || null,
        isSaving: false,
      }));

      return newEntry;
    } catch {
      // Offline: enqueue for batch sync and optimistically show entry
      await enqueue({
        type: 'JOURNAL_ENTRY',
        payload: { content, entryType: type, tags: [], clientTimestamp },
      });

      const offlineEntry: JournalEntry = {
        _id: `offline_${Date.now()}`,
        content,
        type,
        isPrivate: true,
        tags: [],
        createdAt: clientTimestamp,
      };

      set((state) => ({
        entries: [offlineEntry, ...state.entries],
        activeReflection: null,
        isSaving: false,
      }));

      return offlineEntry;
    }
  },

  deleteEntry: async (id) => {
    try {
      await apiClient.delete(`/journal/${id}`);
      set((state) => ({
        entries: state.entries.filter((e) => e._id !== id),
      }));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete entry');
    }
  },
}));
