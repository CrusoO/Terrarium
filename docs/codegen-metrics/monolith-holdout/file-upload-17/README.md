# Receipt Drop Box

A mobile-friendly web app that lets staff upload photos of receipts. The backend stores files on disk and keeps receipt metadata in memory. The frontend provides a drag-and-drop upload form and a receipt log with full-size image previews.

## Quick Start

### 1. Install all dependencies

```bash
npm install
```

This installs root, frontend, and backend dependencies via the root `package.json` workspaces.

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` if you need to change the port (default: `3001`).

### 3. Run in development

```bash
npm run dev
```

This starts both the Vite dev server (port 5173) and the Express API (port 3001) concurrently.

- Frontend: http://localhost:5173
- API: http://localhost:3001/api

### 4. Build for production

```bash
npm run build
```

## Features

- **Upload Screen** — Staff enter their name, optional notes, then select or drag-drop a receipt photo (JPEG, PNG, WebP, GIF up to 10 MB). Camera capture works on mobile.
- **Receipt Log** — Card grid of all submitted receipts with thumbnails, uploader name, date/time, and notes.
- **Detail Modal** — Click any receipt card to open a full-size lightbox with all metadata.
- **Seed Data** — Three example receipts are pre-loaded on server start so the log is never empty.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/receipts` | List all receipts (newest first) |
| POST | `/api/receipts` | Upload a new receipt (multipart/form-data) |
| GET | `/api/receipts/:id` | Get a single receipt by ID |
| GET | `/api/health` | Health check |

### POST `/api/receipts` fields

| Field | Type | Required |
|-------|------|----------|
| `staffName` | string | Yes |
| `notes` | string | No |
| `receipt` | file | Yes |

## Project Structure

```
├── package.json              # Root workspace config
├── shared/
│   └── constants.js          # Shared field names / API paths
├── frontend/
│   ├── vite.config.js        # Vite + proxy config
│   └── src/
│       ├── App.jsx            # Tab navigation root
│       ├── pages/
│       │   ├── UploadPage.jsx
│       │   └── LogPage.jsx
│       ├── components/
│       │   ├── UploadForm.jsx
│       │   ├── ReceiptCard.jsx
│       │   └── StatusBanner.jsx
│       ├── hooks/
│       │   ├── useReceipts.js
│       │   └── useUpload.js
│       └── styles/
│           └── global.css
└── backend/
    ├── .env.example
    └── src/
        ├── server.js
        ├── config/env.js
        ├── routes/receipts.js
        ├── controllers/receiptsController.js
        ├── models/receiptStore.js
        └── middleware/
            ├── upload.js
            └── errorHandler.js
```
