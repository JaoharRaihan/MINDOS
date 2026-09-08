import { Router } from 'express';
import {
  submitTriage,
  getResources,
  logChosenAction,
} from '../controllers/helpController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.post('/triage', submitTriage as any);
router.get('/resources', getResources as any);
router.post('/log-action', logChosenAction as any);

export default router;
