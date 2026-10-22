import React from 'react';
import { Brain, Zap, Globe, Music, FlaskConical } from 'lucide-react';

const categories = [
  { icon: <FlaskConical size={18} />, label: 'Science', color: '#3b82f6' },
  { icon: <Globe size={18} />, label: 'Geography', color: '#10b981' },
  { icon: <Zap size={18} />, label: 'History', color: '#f59e0b' },
  { icon: <Music size={18} />, label: 'Pop Culture', color: '#ec4899' },
];

export default function StartScreen({ totalQuestions, onStart }) {
  return (
    <div className="start-screen">
      <div className="start-icon">
        <Brain size={52} strokeWidth={1.5} />
      </div>
      <h1 className="start-title">Trivia Quiz Bowl</h1>
      <p className="start-subtitle">
        Test your knowledge across four categories. Answer all {totalQuestions} questions
        and see how you stack up!
      </p>

      <div className="category-chips">
        {categories.map((cat) => (
          <span
            key={cat.label}
            className="category-chip"
            style={{ '--chip-color': cat.color }}
          >
            {cat.icon}
            {cat.label}
          </span>
        ))}
      </div>

      <div className="start-rules">
        <div className="rule-item">
          <span className="rule-num">01</span>
          <span>Read each question carefully — only one answer is correct.</span>
        </div>
        <div className="rule-item">
          <span className="rule-num">02</span>
          <span>After selecting, you'll see instant feedback before moving on.</span>
        </div>
        <div className="rule-item">
          <span className="rule-num">03</span>
          <span>Questions and answers are shuffled every session.</span>
        </div>
      </div>

      <button className="btn-primary btn-large" onClick={onStart}>
        Start Quiz — {totalQuestions} Questions
      </button>
    </div>
  );
}
