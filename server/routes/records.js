import express from 'express';
import { 
  getRecords, 
  upsertRecord, 
  batchUpsertRecords, 
  deleteRecord 
} from '../controllers/recordsController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All record routes require authentication
router.use(requireAuth);

router.get('/', asyncHandler(getRecords));
router.put('/:id', asyncHandler(upsertRecord));
router.post('/batch', asyncHandler(batchUpsertRecords));
router.delete('/:id', asyncHandler(deleteRecord));

export default router;
