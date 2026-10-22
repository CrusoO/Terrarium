/**
 * Format an ISO date string (YYYY-MM-DD) into a human-readable date.
 * e.g. "2024-03-15" → "March 15, 2024"
 */
export function formatDate(isoDate) {
  if (!isoDate) return '—';
  // Parse as local date to avoid timezone offset issues
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a numeric string or number as USD currency.
 * e.g. "1234.5" → "$1,234.50"
 */
export function formatCurrency(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

/**
 * Returns today's date as YYYY-MM-DD for use as max attribute on date inputs.
 */
export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
