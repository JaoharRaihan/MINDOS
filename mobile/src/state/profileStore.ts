import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface Goal {
  _id: string;
  title: string;
  category: 'focus' | 'rest' | 'calm' | 'routine';
  targetMinutes?: number;
  createdAt: string;
}

export interface SupportProfileData {
  _id: string;
  userId: string;
  dailyRhythms: {
    wakeTime?: string;
    sleepTime?: string;
    peakEnergyTime?: 'morning' | 'afternoon' | 'evening' | 'late_night';
    highStressHours?: string[];
  };
  sensitivities: {
    overstimulationTriggers: string[];
    pressureTopics: string[];
  };
  preferredInterventionTypes: Array<'physical' | 'breathing' | 'task_breakdown' | 'reflective' | 'sensory_reset'>;
  communicationPreferences: {
    tone: 'gentle' | 'practical' | 'casual';
    responseLength: 'short' | 'balanced';
    language: 'banglish' | 'en' | 'bn';
  };
  goals: Goal[];
  updatedAt: string;
}

interface ProfileState {
  profile: SupportProfileData | null;
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<SupportProfileData>) => Promise<void>;
  addGoal: (goal: { title: string; category?: Goal['category']; targetMinutes?: number }) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.get('/profile');
      set({ profile: res.data.profile, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch support profile',
        isLoading: false,
      });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.put('/profile', data);
      set({ profile: res.data.profile, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to update support profile',
        isLoading: false,
      });
      throw err;
    }
  },

  addGoal: async (goalData) => {
    try {
      const res = await apiClient.post('/profile/goals', goalData);
      set((state) => ({
        profile: state.profile ? { ...state.profile, goals: res.data.goals } : null,
      }));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to add goal');
    }
  },

  deleteGoal: async (goalId: string) => {
    try {
      const res = await apiClient.delete(`/profile/goals/${goalId}`);
      set((state) => ({
        profile: state.profile ? { ...state.profile, goals: res.data.goals } : null,
      }));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to remove goal');
    }
  },
}));
