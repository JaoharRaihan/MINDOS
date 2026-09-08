import { Router } from 'express';
import { createFeedback, getSummary } from '../controllers/feedbackController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.post('/', createFeedback as any);
router.get('/summary', getSummary as any);

export default router;
