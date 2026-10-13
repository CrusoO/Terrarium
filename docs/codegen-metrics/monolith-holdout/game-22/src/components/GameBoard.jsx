import React from 'react';
import { formatMs } from '../utils/helpers.js';

// Maps each phase to a label and sub-label shown inside/below the square
const PHASE_CONTENT = {
  idle: {
    label: 'Tap to Start',
    sub: 'Click or tap the square to begin',
    hint: null,
  },
  waiting: {
    label: 'Wait…',
    sub: 'Get ready — tap when it turns green',
    hint: null,
  },
  green: {
    label: 'TAP NOW!',
    sub: 'As fast as you can!',
    hint: null,
  },
  result: {
    label: null, // filled dynamically
    sub: 'Tap the square to try again',
    hint: null,
  },
  'false-start': {
    label: '⚠ Too Early!',
    sub: 'You tapped before it turned green',
    hint: 'Tap to try again',
  },
};

export default function GameBoard({ phase, reactionTime, onTap, onStart, onReset }) {
  const isIdle = phase === 'idle';
  const isResult = phase === 'result';
  const isFalseStart = phase === 'false-start';
  const isActionable = isIdle || isResult || isFalseStart || phase === 'waiting' || phase === 'green';

  const content = PHASE_CONTENT[phase] || PHASE_CONTENT.idle;

  const squareLabel = isResult
    ? formatMs(reactionTime)
    : content.label;

  const handleClick = () => {
    if (isIdle) {
      onStart();
    } else {
      onTap();
    }
  };

  return (
    <div className="gameboard">
      {/* The reactive square */}
      <button
        className={`game-square phase-${phase}`}
        onClick={handleClick}
        aria-label={`Game square — ${squareLabel}`}
        disabled={false}
      >
        <span className="square-label">{squareLabel}</span>
        {isResult && (
          <span className="square-sublabel">ms</span>
        )}
      </button>

      {/* Status text below the square */}
      <div className="status-block">
        <p className="status-sub">{content.sub}</p>
        {content.hint && <p className="status-hint">{content.hint}</p>}
      </div>

      {/* Reset button — only shown after at least one attempt */}
      {(isResult || isFalseStart) && (
        <button className="btn-reset" onClick={onReset} aria-label="Reset all scores">
          Reset Scores
        </button>
      )}
    </div>
  );
}
