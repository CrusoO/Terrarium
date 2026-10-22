import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT, UPLOADS_DIR } from './config/env.js';
import receiptsRouter from './routes/receipts.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse JSON bodies
app.use(express.json());

// Serve uploaded files as static assets
app.use('/uploads', express.static(UPLOADS_DIR));

// API routes
app.use('/api/receipts', receiptsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralised error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Receipt Drop Box API running on http://localhost:${PORT}`);
  console.log(`Uploads served from: ${UPLOADS_DIR}`);
});

export default app;
