import { Router } from 'express';
import { classifyText, getSafetyAuditSummary } from '../controllers/safetyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/classify', classifyText as any);
router.get('/audit-summary', authenticate as any, getSafetyAuditSummary as any);

export default router;
