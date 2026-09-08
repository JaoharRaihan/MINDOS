import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, TokenPayload } from '../utils/token';
import { User, IUser } from '../models/User';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing Bearer token', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token missing', 401);
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError('User account associated with this token no longer exists', 401);
      }

      req.user = user;
      req.tokenPayload = decoded;
      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired. Please refresh token.',
        });
        return;
      }
      throw new AppError('Invalid access token', 401);
    }
  } catch (error) {
    next(error);
  }
};
