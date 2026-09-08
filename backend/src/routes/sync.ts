import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { batchSync, checkSyncStatus } from '../controllers/syncController';

const router = Router();

router.use(authenticate);

router.post('/batch', batchSync);
router.get('/status', checkSyncStatus);

export default router;
