import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface TalkMessage {
  _id: string;
  sender: 'user' | 'assistant';
  text: string;
  options?: string[];
  suggestedActions?: Array<{
    label: string;
    actionType: string;
    payload?: string;
  }>;
  createdAt?: string;
}

interface TalkState {
  conversationId: string | null;
  messages: TalkMessage[];
  isLoadingHistory: boolean;
  isSending: boolean;
  error: string | null;

  fetchHistory: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  resetSession: () => Promise<void>;
}

export const useTalkStore = create<TalkState>((set, get) => ({
  conversationId: null,
  messages: [],
  isLoadingHistory: false,
  isSending: false,
  error: null,

  fetchHistory: async () => {
    try {
      set({ isLoadingHistory: true, error: null });
      const res = await apiClient.get('/talk/history');
      const { conversation, messages } = res.data;

      set({
        conversationId: conversation?._id || null,
        messages: messages.length > 0 ? messages : [
          {
            _id: 'welcome',
            sender: 'assistant',
            text: "I'm here with you. You can talk freely in Banglish, English, or Bangla. What's on your mind today?",
            options: ['I have too much on my mind', 'Can’t start studying', 'Just feeling heavy'],
          },
        ],
        isLoadingHistory: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Could not load conversation history',
        isLoadingHistory: false,
      });
    }
  },

  sendMessage: async (text: string) => {
    if (!text.trim() || get().isSending) return;

    const tempUserMsg: TalkMessage = {
      _id: `temp-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
    };

    // Optimistically show user message
    set((state) => ({
      messages: [...state.messages, tempUserMsg],
      isSending: true,
      error: null,
    }));

    try {
      const res = await apiClient.post('/talk/message', {
        message: text.trim(),
        conversationId: get().conversationId || undefined,
      });

      const { conversationId, assistantMessage } = res.data;

      set((state) => ({
        conversationId,
        messages: [...state.messages, assistantMessage],
        isSending: false,
      }));
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to send message',
        isSending: false,
      });
      throw err;
    }
  },

  resetSession: async () => {
    try {
      await apiClient.post('/talk/reset');
      set({
        conversationId: null,
        messages: [
          {
            _id: 'new-session',
            sender: 'assistant',
            text: "Starting fresh. I'm here whenever you're ready to share what's on your mind.",
            options: ['Too many thoughts', 'Having trouble starting', 'Just want to chat'],
          },
        ],
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to reset session' });
    }
  },
}));
