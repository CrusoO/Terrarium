import React from 'react';

export default function ScoreBar({ currentIndex, totalQuestions, score }) {
  const progressPct = ((currentIndex) / totalQuestions) * 100;

  return (
    <div className="score-bar">
      <div className="score-bar-top">
        <span className="score-bar-label">
          Question <strong>{currentIndex + 1}</strong> of <strong>{totalQuestions}</strong>
        </span>
        <span className="score-bar-score">
          Score: <strong>{score}</strong>
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={currentIndex}
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
        />
      </div>
    </div>
  );
}
