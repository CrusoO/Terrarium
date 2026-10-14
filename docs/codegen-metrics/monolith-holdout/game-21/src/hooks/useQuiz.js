import { useState, useCallback } from 'react';
import questions from '../data/questions.js';
import { shuffleArray, shuffleAnswers } from '../utils/helpers.js';

/**
 * Prepares a session: shuffles question order and shuffles each question's answers.
 */
function buildSession() {
  const shuffledQuestions = shuffleArray(questions);
  return shuffledQuestions.map((q) => {
    const { shuffledOptions, newCorrectIndex } = shuffleAnswers(q.options, q.correctIndex);
    return {
      ...q,
      options: shuffledOptions,
      correctIndex: newCorrectIndex,
    };
  });
}

export default function useQuiz() {
  const [phase, setPhase] = useState('start'); // start | playing | feedback | results
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]); // index of chosen option per question
  const [selectedOption, setSelectedOption] = useState(null); // chosen option for current question

  const totalQuestions = questions.length;

  const startQuiz = useCallback(() => {
    const session = buildSession();
    setSessionQuestions(session);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswers([]);
    setSelectedOption(null);
    setPhase('playing');
  }, []);

  const answerQuestion = useCallback(
    (optionIndex) => {
      if (phase !== 'playing') return;

      const currentQ = sessionQuestions[currentIndex];
      const isCorrect = optionIndex === currentQ.correctIndex;

      setSelectedOption(optionIndex);
      setPhase('feedback');

      if (isCorrect) {
        setScore((prev) => prev + 1);
      }

      // Record the selected answer
      setSelectedAnswers((prev) => {
        const updated = [...prev];
        updated[currentIndex] = optionIndex;
        return updated;
      });

      // Auto-advance after 1.1 seconds
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= sessionQuestions.length) {
          setPhase('results');
        } else {
          setCurrentIndex(nextIndex);
          setSelectedOption(null);
          setPhase('playing');
        }
      }, 1100);
    },
    [phase, sessionQuestions, currentIndex]
  );

  const resetQuiz = useCallback(() => {
    setPhase('start');
    setSessionQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswers([]);
    setSelectedOption(null);
  }, []);

  const currentQuestion = sessionQuestions[currentIndex] || null;

  return {
    phase,
    sessionQuestions,
    currentIndex,
    currentQuestion,
    score,
    selectedAnswers,
    selectedOption,
    totalQuestions,
    startQuiz,
    answerQuestion,
    resetQuiz,
  };
}
