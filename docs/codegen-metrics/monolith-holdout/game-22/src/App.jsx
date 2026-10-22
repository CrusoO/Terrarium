import React from 'react';
import GameBoard from './components/GameBoard.jsx';
import ScorePanel from './components/ScorePanel.jsx';
import useReactionGame from './hooks/useReactionGame.js';

export default function App() {
  const game = useReactionGame();

  return (
    <div className="app-layout">
      <header className="app-header">
        <span className="app-logo">⚡</span>
        <h1 className="app-title">Reaction Test</h1>
        <span className="app-subtitle">How fast are you?</span>
      </header>

      <main className="app-main">
        <GameBoard
          phase={game.phase}
          reactionTime={game.reactionTime}
          onTap={game.handleTap}
          onStart={game.startGame}
          onReset={game.resetGame}
        />
        <ScorePanel
          reactionTime={game.reactionTime}
          bestTime={game.bestTime}
          attempts={game.attempts}
          phase={game.phase}
          isFalseStart={game.phase === 'false-start'}
        />
      </main>
    </div>
  );
}
