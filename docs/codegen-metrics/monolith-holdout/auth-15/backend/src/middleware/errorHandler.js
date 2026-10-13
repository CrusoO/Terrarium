/**
 * Centralised error response formatter.
 * Catches any error passed via next(err) and returns a consistent JSON shape.
 */
export function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: status === 500 ? 'An unexpected error occurred.' : err.message,
  });
}
