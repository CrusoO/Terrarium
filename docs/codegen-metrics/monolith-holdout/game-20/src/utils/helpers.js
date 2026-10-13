// All 18 unique emoji symbols (enough for 6×6 = 18 pairs)
const SYMBOLS = [
  '🦊', '🐬', '🦋', '🌸', '🍄', '⚡',
  '🎸', '🚀', '🌈', '🦄', '🍕', '🎯',
  '🔮', '🌊', '🦁', '🎃', '🍀', '🏆',
];

const GRID_SIZES = {
  easy:   { rows: 4, cols: 4 }, // 8 pairs
  medium: { rows: 4, cols: 6 }, // 12 pairs
  hard:   { rows: 6, cols: 6 }, // 18 pairs
};

/**
 * Fisher-Yates shuffle — mutates and returns the array.
 */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Generate a shuffled deck of card objects for the given difficulty.
 * Each card: { id: string, symbol: string }
 */
export function generateDeck(difficulty = 'easy') {
  const { rows, cols } = GRID_SIZES[difficulty] || GRID_SIZES.easy;
  const pairCount = (rows * cols) / 2;
  const symbols = SYMBOLS.slice(0, pairCount);

  // Duplicate each symbol to create pairs
  const deck = symbols.flatMap((symbol, i) => [
    { id: `${i}-a`, symbol },
    { id: `${i}-b`, symbol },
  ]);

  return shuffle(deck);
}

/**
 * Format seconds into mm:ss string.
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
