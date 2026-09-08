import { create } from 'zustand';
import { apiClient } from '../api/client';
import { tokenStorage } from '../utils/tokenStorage';

export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  preferredName?: string;
  languagePreference: 'en' | 'bn' | 'banglish';
  onboardingCompleted: boolean;
  communicationTone?: 'gentle' | 'practical' | 'casual';
  primaryFocusAreas?: string[];
  baselineSupportType?: 'micro_actions' | 'conversation' | 'journaling' | 'pattern_tracking';
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    preferredName?: string;
    languagePreference?: 'en' | 'bn' | 'banglish';
  }) => Promise<void>;
  completeOnboarding: (data: {
    communicationTone: 'gentle' | 'practical' | 'casual';
    primaryFocusAreas: string[];
    baselineSupportType: 'micro_actions' | 'conversation' | 'journaling' | 'pattern_tracking';
    preferredName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const { accessToken } = await tokenStorage.getTokens();
      if (!accessToken) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const res = await apiClient.get('/auth/me');
      set({
        user: res.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, tokens } = res.data;

      await tokenStorage.setTokens(tokens);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.post('/auth/register', data);
      const { user, tokens } = res.data;

      await tokenStorage.setTokens(tokens);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  completeOnboarding: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.post('/onboarding/complete', data);
      const { user } = res.data;

      set({
        user,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Could not complete onboarding. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      const { refreshToken } = await tokenStorage.getTokens();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },
}));
