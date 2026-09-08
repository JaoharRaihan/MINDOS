import { Router } from 'express';
import { sendMessage, getHistory, resetSession } from '../controllers/talkController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.post('/message', sendMessage as any);
router.get('/history', getHistory as any);
router.post('/reset', resetSession as any);

export default router;
