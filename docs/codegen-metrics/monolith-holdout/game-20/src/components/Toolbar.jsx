import React from 'react';
import { formatTime } from '../utils/helpers.js';

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', sub: '4×4' },
  { value: 'medium', label: 'Medium', sub: '4×6' },
  { value: 'hard', label: 'Hard', sub: '6×6' },
];

export default function Toolbar({ moves, elapsed, difficulty, onDifficultyChange, onRestart, status }) {
  return (
    <div className="toolbar">
      <div className="toolbar__stats">
        <div className="stat-chip">
          <span className="stat-chip__label">Moves</span>
          <span className="stat-chip__value">{moves}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip__label">Time</span>
          <span className="stat-chip__value">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="toolbar__difficulty">
        {DIFFICULTIES.map(d => (
          <button
            key={d.value}
            className={`diff-btn ${difficulty === d.value ? 'diff-btn--active' : ''}`}
            onClick={() => onDifficultyChange(d.value)}
            aria-pressed={difficulty === d.value}
          >
            <span className="diff-btn__label">{d.label}</span>
            <span className="diff-btn__sub">{d.sub}</span>
          </button>
        ))}
      </div>

      <button className="restart-btn" onClick={onRestart} aria-label="Restart game">
        <span>↺</span>
        <span>Restart</span>
      </button>
    </div>
  );
}
