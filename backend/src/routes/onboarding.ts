import { Router } from 'express';
import { completeOnboarding, getOnboardingStatus } from '../controllers/onboardingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.post('/complete', completeOnboarding as any);
router.get('/status', getOnboardingStatus as any);

export default router;
