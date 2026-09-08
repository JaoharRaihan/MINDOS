import { create } from 'zustand';
import { apiClient } from '../api/client';

export type MemoryType =
  | 'preference'
  | 'goal'
  | 'routine'
  | 'helpful_strategy'
  | 'user_context';

export interface AIMemory {
  _id: string;
  type: MemoryType;
  content: string;
  source: string;
  confidence: number;
  createdAt: string;
}

interface PrivacyState {
  memories: AIMemory[];
  aiMemoryEnabled: boolean;
  isLoading: boolean;
  isExporting: boolean;
  isDeletingAccount: boolean;
  error: string | null;

  fetchMemories: () => Promise<void>;
  addMemory: (type: MemoryType, content: string) => Promise<void>;
  forgetMemory: (id: string) => Promise<void>;
  toggleAIMemory: (enabled: boolean) => Promise<void>;
  exportData: () => Promise<any>;
  deleteAccount: () => Promise<void>;
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  memories: [],
  aiMemoryEnabled: true,
  isLoading: false,
  isExporting: false,
  isDeletingAccount: false,
  error: null,

  fetchMemories: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.get('/privacy/memories');
      set({
        memories: res.data.memories || [],
        aiMemoryEnabled: res.data.aiMemoryEnabled ?? true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Could not load memories',
        isLoading: false,
      });
    }
  },

  addMemory: async (type, content) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.post('/privacy/memories', { type, content });
      set((state) => ({
        memories: [res.data.memory, ...state.memories],
        isLoading: false,
      }));
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to add memory',
        isLoading: false,
      });
      throw err;
    }
  },

  forgetMemory: async (id) => {
    try {
      // Optimistic removal
      const prev = get().memories;
      set({ memories: prev.filter((m) => m._id !== id) });
      await apiClient.delete(`/privacy/memories/${id}`);
    } catch (err: any) {
      // Rollback
      get().fetchMemories();
      throw err;
    }
  },

  toggleAIMemory: async (enabled) => {
    try {
      set({ aiMemoryEnabled: enabled });
      const res = await apiClient.put('/privacy/toggle-memory', { enabled });
      set({ aiMemoryEnabled: res.data.aiMemoryEnabled });
    } catch {
      set({ aiMemoryEnabled: !enabled });
    }
  },

  exportData: async () => {
    try {
      set({ isExporting: true, error: null });
      const res = await apiClient.get('/privacy/export');
      set({ isExporting: false });
      return res.data.export;
    } catch (err: any) {
      set({
        isExporting: false,
        error: err.response?.data?.message || 'Failed to export data',
      });
      throw err;
    }
  },

  deleteAccount: async () => {
    try {
      set({ isDeletingAccount: true, error: null });
      await apiClient.delete('/privacy/account', {
        data: { confirmDelete: true },
      });
      set({ isDeletingAccount: false });
    } catch (err: any) {
      set({
        isDeletingAccount: false,
        error: err.response?.data?.message || 'Failed to delete account',
      });
      throw err;
    }
  },
}));
