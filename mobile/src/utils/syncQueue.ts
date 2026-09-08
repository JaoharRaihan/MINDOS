/**
 * syncQueue.ts
 * Persistent offline action queue for MindOS.
 * Queues check-ins, journal entries, and feedback when offline.
 * Flushes automatically when network connectivity is restored.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

const QUEUE_KEY = 'mindos_offline_sync_queue';

// ─── Queue Item Types ─────────────────────────────────────────────────────────
export type QueueItemType = 'CHECKIN' | 'JOURNAL_ENTRY' | 'FEEDBACK';

export interface QueuedCheckin {
  type: 'CHECKIN';
  payload: {
    mood: 'great' | 'neutral' | 'down' | 'overwhelmed' | 'exhausted';
    energyLevel?: number;
    tags?: string[];
    note?: string;
    date: string;
    clientTimestamp: string;
  };
}

export interface QueuedJournalEntry {
  type: 'JOURNAL_ENTRY';
  payload: {
    content: string;
    entryType?: 'text' | 'voice';
    tags?: string[];
    clientTimestamp: string;
  };
}

export interface QueuedFeedback {
  type: 'FEEDBACK';
  payload: {
    interventionSlug: string;
    rating: 'not_at_all' | 'a_little' | 'somewhat' | 'a_lot';
    perceivedShifts?: string[];
    notes?: string;
    clientTimestamp: string;
  };
}

export type QueueItem = QueuedCheckin | QueuedJournalEntry | QueuedFeedback;

// ─── Load & Save Queue ────────────────────────────────────────────────────────
async function loadQueue(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueueItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Silent fail — best effort
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a queued item to the persistent offline queue.
 */
export async function enqueue(item: QueueItem): Promise<void> {
  const queue = await loadQueue();
  queue.push(item);
  await saveQueue(queue);
}

/**
 * Return current queue length (unsynced item count).
 */
export async function getQueueCount(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}

/**
 * Flush all queued items to the backend via POST /api/sync/batch.
 * Clears the queue on success. Leaves queue intact on network failure.
 * Returns the number of items synced.
 */
export async function flushQueue(): Promise<number> {
  const queue = await loadQueue();
  if (queue.length === 0) return 0;

  const checkins = queue
    .filter((i): i is QueuedCheckin => i.type === 'CHECKIN')
    .map((i) => i.payload);

  const journalEntries = queue
    .filter((i): i is QueuedJournalEntry => i.type === 'JOURNAL_ENTRY')
    .map((i) => ({
      content: i.payload.content,
      type: i.payload.entryType ?? 'text',
      tags: i.payload.tags ?? [],
      clientTimestamp: i.payload.clientTimestamp,
    }));

  const feedbacks = queue
    .filter((i): i is QueuedFeedback => i.type === 'FEEDBACK')
    .map((i) => i.payload);

  try {
    await apiClient.post('/sync/batch', { checkins, journalEntries, feedbacks });
    // Clear queue only on success
    await saveQueue([]);
    return queue.length;
  } catch {
    // Network still unavailable — leave queue intact
    return 0;
  }
}

/**
 * Clear the offline queue completely (e.g. on logout).
 */
export async function clearQueue(): Promise<void> {
  await saveQueue([]);
}
