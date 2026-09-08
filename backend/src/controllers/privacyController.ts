import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  getUserMemories,
  createMemory,
  deleteMemory,
  toggleAIMemory,
  exportAllUserData,
  deleteAllUserData,
} from '../services/privacyService';

const addMemorySchema = z.object({
  type: z.enum(['preference', 'goal', 'routine', 'helpful_strategy', 'user_context']),
  content: z.string().min(2).max(500),
  source: z.enum(['onboarding', 'checkin', 'talk', 'journal', 'manual']).optional(),
});

const toggleMemorySchema = z.object({
  enabled: z.boolean(),
});

const deleteAccountSchema = z.object({
  confirmDelete: z.literal(true),
});

export const getMemories = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { memories, aiMemoryEnabled } = await getUserMemories(req.user._id.toString());

    res.status(200).json({
      success: true,
      count: memories.length,
      memories,
      aiMemoryEnabled,
    });
  } catch (error) {
    next(error);
  }
};

export const addMemory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const validated = addMemorySchema.parse(req.body);
    const memory = await createMemory(req.user._id.toString(), validated);

    res.status(201).json({
      success: true,
      message: 'Memory saved successfully',
      memory,
    });
  } catch (error) {
    next(error);
  }
};

export const forgetMemory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const deleted = await deleteMemory(req.user._id.toString(), id);

    if (!deleted) {
      throw new AppError('Memory not found or already deleted', 404);
    }

    res.status(200).json({
      success: true,
      message: 'MindOS forgot this memory.',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAIMemorySetting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { enabled } = toggleMemorySchema.parse(req.body);
    const result = await toggleAIMemory(req.user._id.toString(), enabled);

    res.status(200).json({
      success: true,
      message: enabled ? 'AI memory retention enabled' : 'AI memory retention paused',
      aiMemoryEnabled: result.aiMemoryEnabled,
    });
  } catch (error) {
    next(error);
  }
};

export const exportUserData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const exportData = await exportAllUserData(req.user._id.toString());

    res.status(200).json({
      success: true,
      export: exportData,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserAccount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    deleteAccountSchema.parse(req.body);
    await deleteAllUserData(req.user._id.toString());

    res.status(200).json({
      success: true,
      message: 'All personal data permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};
