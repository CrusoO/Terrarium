/**
 * Centralised Express error handler.
 * Catches any errors passed via next(err) and returns a consistent JSON response.
 */
function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[Error] ${req.method} ${req.path} —`, err.message);

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode < 500
      ? err.message
      : isDev
        ? err.message
        : 'An unexpected error occurred. Please try again.';

  res.status(statusCode).json({
    message,
    ...(isDev && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
