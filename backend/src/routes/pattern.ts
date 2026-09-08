import { Router } from 'express';
import { getUserPatterns, getPlaybooks } from '../controllers/patternController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/', getUserPatterns as any);
router.get('/playbooks', getPlaybooks as any);

export default router;
