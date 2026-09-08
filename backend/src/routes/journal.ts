import { Router } from 'express';
import {
  createEntry,
  getEntries,
  getEntryById,
  deleteEntry,
} from '../controllers/journalController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.post('/', createEntry as any);
router.get('/', getEntries as any);
router.get('/:id', getEntryById as any);
router.delete('/:id', deleteEntry as any);

export default router;
