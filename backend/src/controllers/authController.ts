import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/token';
import { AuthenticatedRequest } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  preferredName: z.string().optional(),
  languagePreference: z.enum(['en', 'bn', 'banglish']).optional().default('banglish'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    const user = new User({
      email: validatedData.email.toLowerCase(),
      passwordHash,
      name: validatedData.name,
      preferredName: validatedData.preferredName || validatedData.name.split(' ')[0],
      languagePreference: validatedData.languagePreference,
      refreshTokens: [],
    });

    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    user.refreshTokens.push({
      tokenHash: refreshTokenHash,
      createdAt: new Date(),
      expiresAt,
      userAgent: req.headers['user-agent'] as string,
      ipAddress: req.ip,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Prune expired tokens and append the new token
    user.refreshTokens = user.refreshTokens.filter(rt => rt.expiresAt > new Date());
    user.refreshTokens.push({
      tokenHash: refreshTokenHash,
      createdAt: new Date(),
      expiresAt,
      userAgent: req.headers['user-agent'] as string,
      ipAddress: req.ip,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    let payload: { userId: string; email: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const incomingHash = hashToken(refreshToken);
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new AppError('User not found', 401);
    }

    const tokenIndex = user.refreshTokens.findIndex(
      rt => rt.tokenHash === incomingHash && rt.expiresAt > new Date()
    );

    if (tokenIndex === -1) {
      throw new AppError('Refresh token revoked or expired', 401);
    }

    // Token rotation: remove used token and issue a fresh pair
    user.refreshTokens.splice(tokenIndex, 1);

    const newPayload = { userId: user._id.toString(), email: user.email };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    user.refreshTokens.push({
      tokenHash: hashToken(newRefreshToken),
      createdAt: new Date(),
      expiresAt: newExpiresAt,
      userAgent: req.headers['user-agent'] as string,
      ipAddress: req.ip,
    });

    await user.save();

    res.status(200).json({
      success: true,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const incomingHash = hashToken(refreshToken);
      await User.updateOne(
        { 'refreshTokens.tokenHash': incomingHash },
        { $pull: { refreshTokens: { tokenHash: incomingHash } } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    res.status(200).json({
      success: true,
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};
