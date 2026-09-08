import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { analyzeUserPatterns } from '../services/patternService';

export const getUserPatterns = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const patterns = await analyzeUserPatterns(req.user._id.toString());

    res.status(200).json({
      success: true,
      patterns,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlaybooks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const patterns = await analyzeUserPatterns(req.user._id.toString());

    res.status(200).json({
      success: true,
      count: patterns.playbooks.length,
      playbooks: patterns.playbooks,
    });
  } catch (error) {
    next(error);
  }
};
