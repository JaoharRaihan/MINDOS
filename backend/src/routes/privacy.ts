import { Router } from 'express';
import {
  getMemories,
  addMemory,
  forgetMemory,
  toggleAIMemorySetting,
  exportUserData,
  deleteUserAccount,
} from '../controllers/privacyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/memories', getMemories as any);
router.post('/memories', addMemory as any);
router.delete('/memories/:id', forgetMemory as any);
router.put('/toggle-memory', toggleAIMemorySetting as any);
router.get('/export', exportUserData as any);
router.delete('/account', deleteUserAccount as any);

export default router;
