import React, { useState } from 'react';
import GameBoard from './components/GameBoard.jsx';
import Toolbar from './components/Toolbar.jsx';
import WinScreen from './components/WinScreen.jsx';
import useGameState from './hooks/useGameState.js';

export default function App() {
  const [difficulty, setDifficulty] = useState('easy');

  const {
    cards,
    flipped,
    matched,
    moves,
    elapsed,
    status,
    flipCard,
    restartGame,
  } = useGameState(difficulty);

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    restartGame(newDifficulty);
  };

  const handleRestart = () => {
    restartGame(difficulty);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="app-title-icon">🧠</span>
          <h1>Memory Puzzle</h1>
        </div>
      </header>

      <Toolbar
        moves={moves}
        elapsed={elapsed}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        onRestart={handleRestart}
        status={status}
      />

      <main className="app-main">
        <GameBoard
          cards={cards}
          flipped={flipped}
          matched={matched}
          difficulty={difficulty}
          onFlip={flipCard}
        />
      </main>

      {status === 'won' && (
        <WinScreen
          moves={moves}
          elapsed={elapsed}
          difficulty={difficulty}
          onPlayAgain={handleRestart}
          onChangeDifficulty={handleDifficultyChange}
        />
      )}
    </div>
  );
}
