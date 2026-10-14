import React, { useEffect, useState } from 'react';
import { formatTime } from '../utils/helpers.js';

const DIFFICULTY_LABELS = { easy: 'Easy (4×4)', medium: 'Medium (4×6)', hard: 'Hard (6×6)' };

export default function WinScreen({ moves, elapsed, difficulty, onPlayAgain, onChangeDifficulty }) {
  const [bestScore, setBestScore] = useState(null);

  useEffect(() => {
    try {
      const key = `memoryBest_${difficulty}`;
      const stored = JSON.parse(localStorage.getItem(key));
      if (stored) setBestScore(stored);
    } catch (e) {}
  }, [difficulty]);

  const isNewBest = bestScore && bestScore.moves === moves && bestScore.elapsed === elapsed;

  return (
    <div className="win-overlay" role="dialog" aria-modal="true" aria-label="You won!">
      <div className="win-panel">
        <div className="win-panel__confetti">🎉</div>
        <h2 className="win-panel__title">Puzzle Solved!</h2>
        <p className="win-panel__subtitle">{DIFFICULTY_LABELS[difficulty]}</p>

        <div className="win-stats">
          <div className="win-stat">
            <span className="win-stat__icon">🎯</span>
            <span className="win-stat__value">{moves}</span>
            <span className="win-stat__label">Moves</span>
          </div>
          <div className="win-stat">
            <span className="win-stat__icon">⏱️</span>
            <span className="win-stat__value">{formatTime(elapsed)}</span>
            <span className="win-stat__label">Time</span>
          </div>
        </div>

        {bestScore && (
          <div className={`win-best ${isNewBest ? 'win-best--new' : ''}`}>
            {isNewBest ? (
              <span>🏆 New Best Score!</span>
            ) : (
              <span>Best: {bestScore.moves} moves · {formatTime(bestScore.elapsed)}</span>
            )}
          </div>
        )}

        <div className="win-actions">
          <button className="win-btn win-btn--primary" onClick={onPlayAgain}>
            Play Again
          </button>
          <div className="win-difficulty-row">
            {['easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                className={`win-diff-btn ${difficulty === d ? 'win-diff-btn--active' : ''}`}
                onClick={() => onChangeDifficulty(d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
