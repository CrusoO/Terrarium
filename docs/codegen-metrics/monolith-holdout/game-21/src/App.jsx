import React from 'react';
import useQuiz from './hooks/useQuiz.js';
import StartScreen from './components/StartScreen.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import ResultsScreen from './components/ResultsScreen.jsx';

export default function App() {
  const quiz = useQuiz();

  return (
    <div className="app-wrapper">
      <div className="app-container">
        {quiz.phase === 'start' && (
          <StartScreen
            totalQuestions={quiz.totalQuestions}
            onStart={quiz.startQuiz}
          />
        )}
        {(quiz.phase === 'playing' || quiz.phase === 'feedback') && (
          <QuestionCard quiz={quiz} />
        )}
        {quiz.phase === 'results' && (
          <ResultsScreen
            score={quiz.score}
            totalQuestions={quiz.totalQuestions}
            questions={quiz.sessionQuestions}
            selectedAnswers={quiz.selectedAnswers}
            onPlayAgain={quiz.resetQuiz}
          />
        )}
      </div>
    </div>
  );
}
