import { useState, useEffect, useRef, useCallback } from 'react';
import { generateDeck } from '../utils/helpers.js';

export default function useGameState(initialDifficulty = 'easy') {
  const [cards, setCards] = useState(() => generateDeck(initialDifficulty));
  const [flipped, setFlipped] = useState([]);   // indices of currently face-up cards (max 2)
  const [matched, setMatched] = useState([]);   // indices of matched cards
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | playing | won

  const timerRef = useRef(null);
  const lockRef = useRef(false); // prevents clicking during mismatch delay

  // Start/stop timer based on status
  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // Check for win condition
  useEffect(() => {
    if (matched.length > 0 && matched.length === cards.length) {
      setStatus('won');
      saveBestScore();
    }
  }, [matched, cards.length]);

  // Compare two flipped cards
  useEffect(() => {
    if (flipped.length !== 2) return;

    const [a, b] = flipped;
    if (cards[a].symbol === cards[b].symbol) {
      // Match found
      setMatched(prev => [...prev, a, b]);
      setFlipped([]);
      lockRef.current = false;
    } else {
      // No match — reset after delay
      lockRef.current = true;
      const timeout = setTimeout(() => {
        setFlipped([]);
        lockRef.current = false;
      }, 650);
      return () => clearTimeout(timeout);
    }
  }, [flipped, cards]);

  const flipCard = useCallback((index) => {
    // Ignore if locked, already matched, or already flipped
    if (lockRef.current) return;
    if (matched.includes(index)) return;
    if (flipped.includes(index)) return;
    if (flipped.length >= 2) return;

    // Start game on first flip
    if (status === 'idle') setStatus('playing');

    setFlipped(prev => [...prev, index]);

    // Count a move when the second card is flipped
    if (flipped.length === 1) {
      setMoves(prev => prev + 1);
    }
  }, [flipped, matched, status]);

  const restartGame = useCallback((difficulty) => {
    clearInterval(timerRef.current);
    lockRef.current = false;
    setCards(generateDeck(difficulty));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setElapsed(0);
    setStatus('idle');
  }, []);

  const saveBestScore = useCallback(() => {
    try {
      const key = `memoryBest_${initialDifficulty}`;
      const existing = JSON.parse(localStorage.getItem(key));
      const current = { moves, elapsed };

      if (!existing || moves < existing.moves || (moves === existing.moves && elapsed < existing.elapsed)) {
        localStorage.setItem(key, JSON.stringify(current));
      }
    } catch (e) {
      // localStorage unavailable
    }
  }, [initialDifficulty, moves, elapsed]);

  return { cards, flipped, matched, moves, elapsed, status, flipCard, restartGame };
}
