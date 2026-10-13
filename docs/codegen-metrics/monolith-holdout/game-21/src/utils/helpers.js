/**
 * Returns a new array with elements shuffled using Fisher-Yates algorithm.
 * Does not mutate the original array.
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles the answer options for a question while keeping track of the correct answer.
 * Returns { shuffledOptions, newCorrectIndex }
 */
export function shuffleAnswers(options, correctIndex) {
  const indexed = options.map((opt, i) => ({ text: opt, isCorrect: i === correctIndex }));
  const shuffled = shuffleArray(indexed);
  const newCorrectIndex = shuffled.findIndex((item) => item.isCorrect);
  return {
    shuffledOptions: shuffled.map((item) => item.text),
    newCorrectIndex,
  };
}

/**
 * Calculates the percentage score rounded to the nearest integer.
 */
export function calcPercentage(score, total) {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

/**
 * Returns a grade label based on percentage.
 */
export function getGradeLabel(pct) {
  if (pct >= 90) return { label: 'Outstanding!', emoji: '🏆' };
  if (pct >= 75) return { label: 'Great Job!', emoji: '🎉' };
  if (pct >= 60) return { label: 'Good Effort!', emoji: '👍' };
  if (pct >= 40) return { label: 'Keep Practicing!', emoji: '📚' };
  return { label: 'Better Luck Next Time!', emoji: '💪' };
}
