import { Router } from 'express';
import {
  submitCheckin,
  getTodayCheckin,
  getHomeFeed,
  toggleChecklistItem,
  getCheckinHistory,
} from '../controllers/checkinController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.post('/', submitCheckin as any);
router.get('/today', getTodayCheckin as any);
router.get('/home-feed', getHomeFeed as any);
router.post('/checklist/toggle', toggleChecklistItem as any);
router.get('/history', getCheckinHistory as any);

export default router;
