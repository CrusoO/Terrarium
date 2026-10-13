import { useState, useRef, useCallback, useEffect } from 'react';
import { randomDelay } from '../utils/helpers.js';

const LS_BEST = 'rg_best';
const LS_ATTEMPTS = 'rg_attempts';

function loadBest() {
  try {
    const v = localStorage.getItem(LS_BEST);
    return v !== null ? Number(v) : null;
  } catch {
    return null;
  }
}

function loadAttempts() {
  try {
    const v = localStorage.getItem(LS_ATTEMPTS);
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

function saveBest(val) {
  try { localStorage.setItem(LS_BEST, String(val)); } catch {}
}

function saveAttempts(arr) {
  try { localStorage.setItem(LS_ATTEMPTS, JSON.stringify(arr)); } catch {}
}

export default function useReactionGame() {
  // Game phases: 'idle' | 'waiting' | 'green' | 'result' | 'false-start'
  const [phase, setPhase] = useState('idle');
  const [reactionTime, setReactionTime] = useState(null);
  const [bestTime, setBestTime] = useState(loadBest);
  const [attempts, setAttempts] = useState(loadAttempts);

  // Refs to hold mutable timer handles and timestamps
  const waitTimerRef = useRef(null);
  const greenAtRef = useRef(null);

  // Clear any pending timers
  const clearTimers = useCallback(() => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  // Start a new round: idle → waiting → green
  const startGame = useCallback(() => {
    clearTimers();
    setPhase('waiting');
    setReactionTime(null);

    const delay = randomDelay(1000, 4000);
    waitTimerRef.current = setTimeout(() => {
      greenAtRef.current = performance.now();
      setPhase('green');
    }, delay);
  }, [clearTimers]);

  // Handle a tap/click on the square
  const handleTap = useCallback(() => {
    if (phase === 'waiting') {
      // Tapped too early — false start
      clearTimers();
      setPhase('false-start');
      return;
    }

    if (phase === 'green') {
      const elapsed = Math.round(performance.now() - greenAtRef.current);
      setReactionTime(elapsed);
      setPhase('result');

      // Persist attempt (keep last 10 in storage but track all in state for display)
      setAttempts(prev => {
        const next = [...prev, elapsed];
        saveAttempts(next.slice(-10)); // persist only last 10
        return next.slice(-10);
      });

      // Update best time
      setBestTime(prev => {
        const newBest = prev === null || elapsed < prev ? elapsed : prev;
        if (newBest !== prev) saveBest(newBest);
        return newBest;
      });
      return;
    }

    if (phase === 'result' || phase === 'false-start') {
      // Tap again to restart
      startGame();
    }
  }, [phase, clearTimers, startGame]);

  // Full reset — clears scores and returns to idle
  const resetGame = useCallback(() => {
    clearTimers();
    setPhase('idle');
    setReactionTime(null);
    setBestTime(null);
    setAttempts([]);
    try {
      localStorage.removeItem(LS_BEST);
      localStorage.removeItem(LS_ATTEMPTS);
    } catch {}
  }, [clearTimers]);

  return {
    phase,
    reactionTime,
    bestTime,
    attempts,
    startGame,
    handleTap,
    resetGame,
  };
}
