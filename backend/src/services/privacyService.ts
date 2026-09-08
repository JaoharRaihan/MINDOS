import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Memory, IMemory, MemoryType } from '../models/Memory';
import { SupportProfile } from '../models/SupportProfile';
import { Checkin } from '../models/Checkin';
import { DailyProgress } from '../models/DailyProgress';
import { Journal } from '../models/Journal';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { InterventionSession } from '../models/InterventionSession';
import { InterventionFeedback } from '../models/InterventionFeedback';
import { TriageLog } from '../models/TriageLog';
import { AppError } from '../middleware/errorHandler';

export interface UserMemoriesResponse {
  memories: IMemory[];
  aiMemoryEnabled: boolean;
}

export const getUserMemories = async (userId: string): Promise<UserMemoriesResponse> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userObjectId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  let memories = await Memory.find({ userId: userObjectId, isActive: true }).sort({ createdAt: -1 });

  // If user has 0 memories, seed transparent starter memories from their profile
  if (memories.length === 0) {
    const profile = await SupportProfile.findOne({ userId: userObjectId });
    const starterMemories = [
      {
        userId: userObjectId,
        type: 'preference' as MemoryType,
        content: `Prefers ${user.communicationTone || 'practical'} communication tone with low-pressure support.`,
        source: 'onboarding' as const,
        confidence: 1.0,
      },
      {
        userId: userObjectId,
        type: 'routine' as MemoryType,
        content: `Target wake rhythm around ${profile?.dailyRhythms?.wakeTime || '07:30'} and sleep around ${profile?.dailyRhythms?.sleepTime || '23:30'}.`,
        source: 'onboarding' as const,
        confidence: 0.9,
      },
      {
        userId: userObjectId,
        type: 'helpful_strategy' as MemoryType,
        content: 'Finds small 5-minute micro-steps effective when starting is difficult.',
        source: 'onboarding' as const,
        confidence: 0.9,
      },
    ];

    if (user.primaryFocusAreas && user.primaryFocusAreas.length > 0) {
      starterMemories.push({
        userId: userObjectId,
        type: 'user_context' as MemoryType,
        content: `Primary life focus areas include: ${user.primaryFocusAreas.join(', ')}.`,
        source: 'onboarding' as const,
        confidence: 1.0,
      });
    }

    memories = await Memory.insertMany(starterMemories);
  }

  return {
    memories,
    aiMemoryEnabled: user.privacySettings?.aiMemoryEnabled ?? true,
  };
};

export const createMemory = async (
  userId: string,
  data: {
    type: MemoryType;
    content: string;
    source?: 'onboarding' | 'checkin' | 'talk' | 'journal' | 'manual';
    confidence?: number;
  }
): Promise<IMemory> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userObjectId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.privacySettings?.aiMemoryEnabled === false) {
    throw new AppError('AI Memory is currently paused in your privacy settings.', 400);
  }

  const memory = new Memory({
    userId: userObjectId,
    type: data.type,
    content: data.content,
    source: data.source || 'manual',
    confidence: data.confidence !== undefined ? data.confidence : 1.0,
  });

  return await memory.save();
};

export const deleteMemory = async (userId: string, memoryId: string): Promise<boolean> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const result = await Memory.findOneAndDelete({ _id: memoryId, userId: userObjectId });
  return Boolean(result);
};

export const toggleAIMemory = async (
  userId: string,
  enabled: boolean
): Promise<{ aiMemoryEnabled: boolean }> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.privacySettings) {
    user.privacySettings = { aiMemoryEnabled: enabled, allowAnalytics: true };
  } else {
    user.privacySettings.aiMemoryEnabled = enabled;
  }

  await user.save();
  return { aiMemoryEnabled: user.privacySettings.aiMemoryEnabled };
};

export interface ExportDataPayload {
  exportedAt: string;
  formatVersion: string;
  user: Partial<IUser>;
  supportProfile: any;
  checkins: any[];
  dailyProgress: any[];
  journalEntries: any[];
  conversations: any[];
  messages: any[];
  interventionSessions: any[];
  interventionFeedback: any[];
  triageLogs: any[];
  aiMemories: any[];
}

export const exportAllUserData = async (userId: string): Promise<ExportDataPayload> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [
    user,
    supportProfile,
    checkins,
    dailyProgress,
    journalEntries,
    conversations,
    messages,
    interventionSessions,
    interventionFeedback,
    triageLogs,
    aiMemories,
  ] = await Promise.all([
    User.findById(userObjectId),
    SupportProfile.findOne({ userId: userObjectId }),
    Checkin.find({ userId: userObjectId }).sort({ date: -1 }),
    DailyProgress.find({ userId: userObjectId }).sort({ date: -1 }),
    Journal.find({ userId: userObjectId }).sort({ createdAt: -1 }),
    Conversation.find({ userId: userObjectId }).sort({ createdAt: -1 }),
    Message.find({ userId: userObjectId }).sort({ createdAt: 1 }),
    InterventionSession.find({ userId: userObjectId }).sort({ startedAt: -1 }),
    InterventionFeedback.find({ userId: userObjectId }).sort({ createdAt: -1 }),
    TriageLog.find({ userId: userObjectId }).sort({ createdAt: -1 }),
    Memory.find({ userId: userObjectId }).sort({ createdAt: -1 }),
  ]);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    exportedAt: new Date().toISOString(),
    formatVersion: '1.0.0',
    user: user.toSafeObject(),
    supportProfile: supportProfile || null,
    checkins,
    dailyProgress,
    journalEntries,
    conversations,
    messages,
    interventionSessions,
    interventionFeedback,
    triageLogs,
    aiMemories,
  };
};

export const deleteAllUserData = async (userId: string): Promise<void> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  await Promise.all([
    User.deleteOne({ _id: userObjectId }),
    SupportProfile.deleteMany({ userId: userObjectId }),
    Checkin.deleteMany({ userId: userObjectId }),
    DailyProgress.deleteMany({ userId: userObjectId }),
    Journal.deleteMany({ userId: userObjectId }),
    Conversation.deleteMany({ userId: userObjectId }),
    Message.deleteMany({ userId: userObjectId }),
    InterventionSession.deleteMany({ userId: userObjectId }),
    InterventionFeedback.deleteMany({ userId: userObjectId }),
    TriageLog.deleteMany({ userId: userObjectId }),
    Memory.deleteMany({ userId: userObjectId }),
  ]);
};
