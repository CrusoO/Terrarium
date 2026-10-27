import React from 'react';

export default function Card({ symbol, index, isFlipped, isMatched, onClick }) {
  const faceUp = isFlipped || isMatched;

  return (
    <button
      className={`card ${faceUp ? 'card--flipped' : ''} ${isMatched ? 'card--matched' : ''}`}
      onClick={onClick}
      disabled={isMatched}
      aria-label={faceUp ? `Card: ${symbol}` : 'Face-down card'}
      aria-pressed={faceUp}
    >
      <div className="card__inner">
        <div className="card__back">
          <span className="card__back-pattern">✦</span>
        </div>
        <div className="card__front">
          <span className="card__symbol">{symbol}</span>
        </div>
      </div>
    </button>
  );
}
