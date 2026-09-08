import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { evaluateInputSafety, filterOutputSafety } from '../services/safetyService';
import { SafetyAuditLog } from '../models/SafetyAuditLog';

const classifySchema = z.object({
  text: z.string().min(1),
});

export const classifyText = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text } = classifySchema.parse(req.body);
    const evaluation = evaluateInputSafety(text);
    const outputFilter = filterOutputSafety(text);

    res.status(200).json({
      success: true,
      inputSafety: {
        isSafe: evaluation.isSafe,
        category: evaluation.category,
        severity: evaluation.severity,
        matchedRule: evaluation.matchedRule,
      },
      outputSafety: {
        wasModified: outputFilter.wasModified,
        ruleTriggered: outputFilter.ruleTriggered,
        sanitizedText: outputFilter.text,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSafetyAuditSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const logs = await SafetyAuditLog.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const counts = {
      crisisRedirects: logs.filter((l) => l.actionTaken === 'crisis_redirect').length,
      clinicalDisclaimers: logs.filter((l) => l.actionTaken === 'clinical_boundary_disclaimer').length,
      outputsRedacted: logs.filter((l) => l.actionTaken === 'output_redacted').length,
    };

    res.status(200).json({
      success: true,
      counts,
      recentLogs: logs,
    });
  } catch (error) {
    next(error);
  }
};
