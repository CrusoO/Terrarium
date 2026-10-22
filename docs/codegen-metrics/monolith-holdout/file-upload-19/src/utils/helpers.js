/**
 * Format a byte count into a human-readable string.
 * e.g. 1024 → "1.0 KB", 1048576 → "1.0 MB"
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
  const value = bytes / Math.pow(1024, exp);
  return `${value.toFixed(exp === 0 ? 0 : 1)} ${units[exp]}`;
}

/**
 * Return true if the given File is an image type we want to accept.
 */
export function isImageFile(file) {
  return file.type.startsWith('image/');
}
