import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload.js';
import {
  listReceipts,
  getReceipt,
  createReceipt,
} from '../controllers/receiptsController.js';

const router = Router();

// List all receipts
router.get('/', listReceipts);

// Get single receipt metadata
router.get('/:id', getReceipt);

// Upload a new receipt (multipart/form-data)
router.post('/', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) return next(err);
    createReceipt(req, res, next);
  });
});

export default router;
