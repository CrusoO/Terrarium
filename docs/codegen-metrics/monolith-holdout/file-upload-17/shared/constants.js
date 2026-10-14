// Shared constants between frontend and backend
export const API_BASE = '/api';
export const RECEIPTS_ENDPOINT = `${API_BASE}/receipts`;

export const FIELD_NAMES = {
  STAFF_NAME: 'staffName',
  NOTES: 'notes',
  FILE: 'receipt',
};

export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
