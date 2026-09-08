import { create } from 'zustand';
import { apiClient } from '../api/client';

export type FeedbackRating = 'not_at_all' | 'a_little' | 'somewhat' | 'a_lot';

export interface PendingSessionInfo {
  sessionId: string;
  interventionTitle: string;
  interventionSlug: string;
}

interface FeedbackState {
  isOpen: boolean;
  pendingSession: PendingSessionInfo | null;
  selectedRating: FeedbackRating | null;
  selectedShifts: string[];
  notes: string;
  isSubmitting: boolean;
  error: string | null;

  openFeedback: (sessionId: string, title: string, slug: string) => void;
  closeFeedback: () => void;
  selectRating: (rating: FeedbackRating) => void;
  toggleShift: (shiftKey: string) => void;
  setNotes: (text: string) => void;
  submitFeedback: () => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  isOpen: false,
  pendingSession: null,
  selectedRating: null,
  selectedShifts: [],
  notes: '',
  isSubmitting: false,
  error: null,

  openFeedback: (sessionId, interventionTitle, interventionSlug) => {
    set({
      isOpen: true,
      pendingSession: { sessionId, interventionTitle, interventionSlug },
      selectedRating: null,
      selectedShifts: [],
      notes: '',
      error: null,
    });
  },

  closeFeedback: () => {
    set({
      isOpen: false,
      pendingSession: null,
      selectedRating: null,
      selectedShifts: [],
      notes: '',
      error: null,
    });
  },

  selectRating: (rating) => {
    set({ selectedRating: rating });
  },

  toggleShift: (shiftKey) => {
    const { selectedShifts } = get();
    if (selectedShifts.includes(shiftKey)) {
      set({ selectedShifts: selectedShifts.filter((s) => s !== shiftKey) });
    } else {
      set({ selectedShifts: [...selectedShifts, shiftKey] });
    }
  },

  setNotes: (notes) => {
    set({ notes });
  },

  submitFeedback: async () => {
    const { pendingSession, selectedRating, selectedShifts, notes } = get();
    if (!pendingSession || !selectedRating) return;

    try {
      set({ isSubmitting: true, error: null });

      await apiClient.post('/feedback', {
        sessionId: pendingSession.sessionId,
        rating: selectedRating,
        perceivedShifts: selectedShifts,
        notes: notes.trim() || undefined,
      });

      set({
        isOpen: false,
        pendingSession: null,
        selectedRating: null,
        selectedShifts: [],
        notes: '',
        isSubmitting: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to submit feedback',
        isSubmitting: false,
      });
    }
  },
}));
