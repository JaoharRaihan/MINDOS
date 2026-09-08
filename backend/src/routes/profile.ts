import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  addGoal,
  deleteGoal,
} from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/', getProfile as any);
router.put('/', updateProfile as any);
router.post('/goals', addGoal as any);
router.delete('/goals/:goalId', deleteGoal as any);

export default router;
