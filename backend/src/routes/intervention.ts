import { Router } from 'express';
import {
  getInterventions,
  getIntervention,
  getRecommendedInterventions,
  startSession,
  completeSession,
  abandonSession,
} from '../controllers/interventionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/', getInterventions as any);
router.get('/recommended', getRecommendedInterventions as any);
router.get('/:identifier', getIntervention as any);
router.post('/start', startSession as any);
router.post('/complete', completeSession as any);
router.post('/abandon', abandonSession as any);

export default router;
