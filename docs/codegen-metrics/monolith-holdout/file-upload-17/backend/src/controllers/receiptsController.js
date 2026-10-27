import { v4 as uuidv4 } from 'uuid';
import { getAllReceipts, getReceiptById, addReceipt } from '../models/receiptStore.js';

// GET /api/receipts — return all receipts (newest first)
export function listReceipts(req, res) {
  const receipts = getAllReceipts();
  res.json(receipts);
}

// GET /api/receipts/:id — return single receipt metadata
export function getReceipt(req, res) {
  const receipt = getReceiptById(req.params.id);
  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found.' });
  }
  res.json(receipt);
}

// POST /api/receipts — handle multipart upload
export function createReceipt(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const staffName = (req.body.staffName || '').trim();
  if (!staffName) {
    return res.status(400).json({ error: 'staffName is required.' });
  }

  const receipt = {
    id: uuidv4(),
    staffName,
    notes: (req.body.notes || '').trim(),
    originalFilename: req.file.originalname,
    storedFilename: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    uploadedAt: new Date().toISOString(),
  };

  addReceipt(receipt);
  console.log(`[Receipt] Saved: ${receipt.id} from ${receipt.staffName}`);
  res.status(201).json(receipt);
}
