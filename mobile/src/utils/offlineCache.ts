/**
 * offlineCache.ts
 * TTL-aware AsyncStorage cache abstraction for MindOS offline resilience.
 * All cached data is strongly typed and automatically expires.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Cache Keys ───────────────────────────────────────────────────────────────
export const CACHE_KEYS = {
  HOME_FEED: 'mindos_cache_home_feed',
  JOURNAL_ENTRIES: 'mindos_cache_journal_entries',
  INTERVENTIONS: 'mindos_cache_interventions',
  PROFILE: 'mindos_cache_profile',
  PLAYBOOKS: 'mindos_cache_playbooks',
} as const;

export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS];

// ─── Default TTLs (milliseconds) ─────────────────────────────────────────────
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  cachedAt: number; // Unix ms
  ttlMs: number;
}

/**
 * Store data with an optional TTL (defaults to 24 hours).
 */
export async function setCache<T>(key: CacheKey, data: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      ttlMs,
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Silent fail — cache is best-effort
  }
}

/**
 * Retrieve cached data if it exists and has not expired.
 * Returns null if missing or stale.
 */
export async function getCache<T>(key: CacheKey): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.cachedAt;

    if (age > entry.ttlMs) {
      // Stale — clean up
      await AsyncStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Remove a single cache entry.
 */
export async function removeCache(key: CacheKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Silent fail
  }
}

/**
 * Clear all MindOS cache entries.
 */
export async function clearAllCache(): Promise<void> {
  try {
    for (const key of Object.values(CACHE_KEYS)) {
      await AsyncStorage.removeItem(key);
    }
  } catch {
    // Silent fail
  }
}
