// Environment configuration with sensible defaults
export const PORT = parseInt(process.env.PORT || '3001', 10);
export const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
export const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
