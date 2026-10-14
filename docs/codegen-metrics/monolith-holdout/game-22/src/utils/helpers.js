/**
 * Format a millisecond value for display.
 * e.g. 243 → "243"
 */
export function formatMs(ms) {
  if (ms === null || ms === undefined) return '—';
  return String(ms);
}

/**
 * Generate a random integer delay between min and max (inclusive), in ms.
 */
export function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Return a rating object based on reaction time in ms.
 */
export function getRating(ms) {
  if (ms === null || ms === undefined) return { level: 'none', label: 'N/A', emoji: '' };
  if (ms < 150) return { level: 'legendary', label: 'Legendary', emoji: '🏆' };
  if (ms < 200) return { level: 'excellent', label: 'Excellent', emoji: '🥇' };
  if (ms < 250) return { level: 'great',     label: 'Great',     emoji: '⚡' };
  if (ms < 300) return { level: 'good',      label: 'Good',      emoji: '👍' };
  if (ms < 400) return { level: 'average',   label: 'Average',   emoji: '😐' };
  if (ms < 500) return { level: 'slow',      label: 'Slow',      emoji: '🐢' };
  return              { level: 'veryslow',   label: 'Very Slow', emoji: '😴' };
}
