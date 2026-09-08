/**
 * networkStore.ts
 * Online/offline status tracker + sync orchestration for MindOS.
 * Uses periodic polling via /api/sync/status to detect connectivity.
 * Triggers queue flush automatically when coming back online.
 */
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { flushQueue, getQueueCount } from '../utils/syncQueue';

interface NetworkState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingQueueCount: number;
  lastSyncedAt: string | null;

  checkConnectivity: () => Promise<boolean>;
  flushOfflineQueue: () => Promise<void>;
  refreshQueueCount: () => Promise<void>;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true,
  isSyncing: false,
  pendingQueueCount: 0,
  lastSyncedAt: null,

  checkConnectivity: async () => {
    try {
      await apiClient.get('/sync/status', { timeout: 4000 });
      const wasOffline = !get().isOnline;
      set({ isOnline: true });

      if (wasOffline) {
        // Came back online — flush any queued items
        await get().flushOfflineQueue();
      }

      return true;
    } catch {
      set({ isOnline: false });
      return false;
    }
  },

  flushOfflineQueue: async () => {
    const { pendingQueueCount, isSyncing } = get();
    if (isSyncing || pendingQueueCount === 0) return;

    set({ isSyncing: true });

    try {
      const syncedCount = await flushQueue();
      if (syncedCount > 0) {
        set({
          pendingQueueCount: 0,
          lastSyncedAt: new Date().toISOString(),
          isSyncing: false,
        });
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  refreshQueueCount: async () => {
    const count = await getQueueCount();
    set({ pendingQueueCount: count });
  },
}));
