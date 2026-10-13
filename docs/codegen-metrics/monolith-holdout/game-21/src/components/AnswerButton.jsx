import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * state: 'idle' | 'correct' | 'wrong' | 'missed'
 * - correct: this button was selected and it's right
 * - wrong: this button was selected and it's wrong
 * - missed: this button is the correct answer but wasn't selected
 * - idle: no feedback yet
 */
export default function AnswerButton({ label, optionText, state, onClick, disabled }) {
  const iconMap = {
    correct: <CheckCircle size={20} className="answer-icon" />,
    wrong: <XCircle size={20} className="answer-icon" />,
    missed: <CheckCircle size={20} className="answer-icon" />,
    idle: null,
  };

  return (
    <button
      className={`answer-btn answer-btn--${state}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Option ${label}: ${optionText}`}
    >
      <span className="answer-label">{label}</span>
      <span className="answer-text">{optionText}</span>
      {iconMap[state]}
    </button>
  );
}
