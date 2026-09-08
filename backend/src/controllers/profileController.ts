import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { SupportProfile, ISupportProfile } from '../models/SupportProfile';

const updateProfileSchema = z.object({
  dailyRhythms: z
    .object({
      wakeTime: z.string().optional(),
      sleepTime: z.string().optional(),
      peakEnergyTime: z.enum(['morning', 'afternoon', 'evening', 'late_night']).optional(),
      highStressHours: z.array(z.string()).optional(),
    })
    .optional(),
  sensitivities: z
    .object({
      overstimulationTriggers: z.array(z.string()).optional(),
      pressureTopics: z.array(z.string()).optional(),
    })
    .optional(),
  preferredInterventionTypes: z
    .array(z.enum(['physical', 'breathing', 'task_breakdown', 'reflective', 'sensory_reset']))
    .optional(),
  communicationPreferences: z
    .object({
      tone: z.enum(['gentle', 'practical', 'casual']).optional(),
      responseLength: z.enum(['short', 'balanced']).optional(),
      language: z.enum(['banglish', 'en', 'bn']).optional(),
    })
    .optional(),
});

const goalSchema = z.object({
  title: z.string().min(2, 'Goal title must be at least 2 characters'),
  category: z.enum(['focus', 'rest', 'calm', 'routine']).default('focus'),
  targetMinutes: z.number().positive().optional(),
});

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    let profile = await SupportProfile.findOne({ userId: req.user._id });

    if (!profile) {
      // Seed default profile from user account defaults
      profile = await SupportProfile.create({
        userId: req.user._id,
        dailyRhythms: {
          wakeTime: '07:30',
          sleepTime: '23:30',
          peakEnergyTime: 'morning',
          highStressHours: ['afternoon'],
        },
        sensitivities: {
          overstimulationTriggers: ['multiple_deadlines'],
          pressureTopics: ['exams_academic'],
        },
        preferredInterventionTypes: ['task_breakdown', 'breathing'],
        communicationPreferences: {
          tone: req.user.communicationTone || 'practical',
          responseLength: 'short',
          language: req.user.languagePreference || 'banglish',
        },
        goals: [
          {
            title: 'Start 5-minute study sessions without delay',
            category: 'focus',
            targetMinutes: 5,
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const validatedData = updateProfileSchema.parse(req.body);

    let profile = await SupportProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new SupportProfile({ userId: req.user._id });
    }

    if (validatedData.dailyRhythms) {
      profile.dailyRhythms = {
        ...profile.dailyRhythms,
        ...validatedData.dailyRhythms,
      };
    }

    if (validatedData.sensitivities) {
      profile.sensitivities = {
        ...profile.sensitivities,
        ...validatedData.sensitivities,
      };
    }

    if (validatedData.preferredInterventionTypes) {
      profile.preferredInterventionTypes = validatedData.preferredInterventionTypes;
    }

    if (validatedData.communicationPreferences) {
      profile.communicationPreferences = {
        ...profile.communicationPreferences,
        ...validatedData.communicationPreferences,
      };
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Support profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const addGoal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const validatedGoal = goalSchema.parse(req.body);

    let profile = await SupportProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await SupportProfile.create({ userId: req.user._id, goals: [] });
    }

    profile.goals.push(validatedGoal as any);
    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Goal added successfully',
      goals: profile.goals,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { goalId } = req.params;
    if (!goalId) {
      throw new AppError('Goal ID is required', 400);
    }

    const profile = await SupportProfile.findOne({ userId: req.user._id });
    if (!profile) {
      throw new AppError('Support profile not found', 404);
    }

    profile.goals = profile.goals.filter((g: any) => g._id.toString() !== goalId);
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Goal removed successfully',
      goals: profile.goals,
    });
  } catch (error) {
    next(error);
  }
};
