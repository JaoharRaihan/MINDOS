import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const completeOnboardingSchema = z.object({
  communicationTone: z.enum(['gentle', 'practical', 'casual']),
  primaryFocusAreas: z.array(z.string()).min(1, 'Please select at least one focus area'),
  baselineSupportType: z.enum(['micro_actions', 'conversation', 'journaling', 'pattern_tracking']),
  preferredName: z.string().trim().optional(),
});

export const completeOnboarding = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const validatedData = completeOnboardingSchema.parse(req.body);

    req.user.communicationTone = validatedData.communicationTone;
    req.user.primaryFocusAreas = validatedData.primaryFocusAreas;
    req.user.baselineSupportType = validatedData.baselineSupportType;
    if (validatedData.preferredName) {
      req.user.preferredName = validatedData.preferredName;
    }
    req.user.onboardingCompleted = true;

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

export const getOnboardingStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    res.status(200).json({
      success: true,
      onboardingCompleted: req.user.onboardingCompleted,
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};
