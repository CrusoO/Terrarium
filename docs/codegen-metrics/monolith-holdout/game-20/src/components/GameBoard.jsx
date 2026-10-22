import React from 'react';
import Card from './Card.jsx';

const GRID_COLS = {
  easy: 4,
  medium: 6,
  hard: 6,
};

export default function GameBoard({ cards, flipped, matched, difficulty, onFlip }) {
  const cols = GRID_COLS[difficulty] || 4;

  return (
    <div
      className="game-board"
      style={{ '--grid-cols': cols }}
      aria-label="Memory card grid"
    >
      {cards.map((card, index) => (
        <Card
          key={card.id}
          symbol={card.symbol}
          index={index}
          isFlipped={flipped.includes(index)}
          isMatched={matched.includes(index)}
          onClick={() => onFlip(index)}
        />
      ))}
    </div>
  );
}
