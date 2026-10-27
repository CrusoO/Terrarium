/**
 * Calculate the average of a numeric array, rounded to 1 decimal place.
 */
export function calcAverage(values) {
  if (!values.length) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

/**
 * Calculate the total of a numeric array, rounded to 1 decimal place.
 */
export function calcTotal(values) {
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round(sum * 10) / 10;
}

/**
 * Format a YYYY-MM-DD date string into a short label like "14 Jul".
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
