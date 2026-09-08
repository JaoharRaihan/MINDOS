/**
 * accessibilityStore.ts
 * User-controlled accessibility preferences for MindOS.
 * Persists settings to AsyncStorage so preferences survive app restarts.
 * Settings: high-contrast mode, reduced motion, font scale multiplier.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'mindos_a11y_preferences';

interface AccessibilityState {
  isHighContrast: boolean;
  reduceMotion: boolean;
  fontScale: number; // 1.0 = normal, 1.2 = large, 1.4 = extra large

  loadPreferences: () => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  setReduceMotion: (enabled: boolean) => Promise<void>;
  setFontScale: (scale: number) => Promise<void>;
}

async function persistPreferences(prefs: {
  isHighContrast: boolean;
  reduceMotion: boolean;
  fontScale: number;
}): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Silent fail
  }
}

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  isHighContrast: false,
  reduceMotion: false,
  fontScale: 1.0,

  loadPreferences: async () => {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        set({
          isHighContrast: prefs.isHighContrast ?? false,
          reduceMotion: prefs.reduceMotion ?? false,
          fontScale: prefs.fontScale ?? 1.0,
        });
      }
    } catch {
      // Use defaults
    }
  },

  setHighContrast: async (enabled) => {
    set({ isHighContrast: enabled });
    const { reduceMotion, fontScale } = get();
    await persistPreferences({ isHighContrast: enabled, reduceMotion, fontScale });
  },

  setReduceMotion: async (enabled) => {
    set({ reduceMotion: enabled });
    const { isHighContrast, fontScale } = get();
    await persistPreferences({ isHighContrast, reduceMotion: enabled, fontScale });
  },

  setFontScale: async (scale) => {
    const clampedScale = Math.min(Math.max(scale, 1.0), 1.4);
    set({ fontScale: clampedScale });
    const { isHighContrast, reduceMotion } = get();
    await persistPreferences({ isHighContrast, reduceMotion, fontScale: clampedScale });
  },
}));
