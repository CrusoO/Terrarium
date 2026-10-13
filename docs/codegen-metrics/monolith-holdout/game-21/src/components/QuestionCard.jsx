import React from 'react';
import ScoreBar from './ScoreBar.jsx';
import AnswerButton from './AnswerButton.jsx';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const CATEGORY_COLORS = {
  Science: '#3b82f6',
  Geography: '#10b981',
  History: '#f59e0b',
  'Pop Culture': '#ec4899',
};

export default function QuestionCard({ quiz }) {
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    score,
    phase,
    selectedOption,
    answerQuestion,
  } = quiz;

  if (!currentQuestion) return null;

  const isFeedback = phase === 'feedback';

  function getButtonState(optionIndex) {
    if (!isFeedback) return 'idle';
    if (optionIndex === currentQuestion.correctIndex) {
      return selectedOption === optionIndex ? 'correct' : 'missed';
    }
    if (optionIndex === selectedOption) return 'wrong';
    return 'idle';
  }

  const categoryColor = CATEGORY_COLORS[currentQuestion.category] || '#6366f1';

  return (
    <div className="question-card">
      <ScoreBar
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        score={score}
      />

      <div className="question-body">
        <span
          className="category-badge"
          style={{ '--badge-color': categoryColor }}
        >
          {currentQuestion.category}
        </span>

        <h2 className="question-text">{currentQuestion.question}</h2>

        <div className="answers-grid">
          {currentQuestion.options.map((option, idx) => (
            <AnswerButton
              key={idx}
              label={OPTION_LABELS[idx]}
              optionText={option}
              state={getButtonState(idx)}
              onClick={() => answerQuestion(idx)}
              disabled={isFeedback}
            />
          ))}
        </div>

        {isFeedback && (
          <p className="feedback-hint">
            {selectedOption === currentQuestion.correctIndex
              ? '✅ Correct! Moving on…'
              : `❌ The correct answer was: ${currentQuestion.options[currentQuestion.correctIndex]}`}
          </p>
        )}
      </div>
    </div>
  );
}
