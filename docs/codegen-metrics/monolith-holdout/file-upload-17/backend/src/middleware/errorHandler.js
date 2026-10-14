// Centralised error response middleware
export function errorHandler(err, _req, res, _next) {
  console.error('[ErrorHandler]', err.message);

  // Multer-specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `File too large. Maximum allowed size is 10 MB.`,
    });
  }

  if (err.message && err.message.startsWith('Unsupported file type')) {
    return res.status(415).json({ error: err.message });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected error occurred.',
  });
}
