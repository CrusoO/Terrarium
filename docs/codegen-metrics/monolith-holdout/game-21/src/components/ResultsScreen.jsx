import React from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { calcPercentage, getGradeLabel } from '../utils/helpers.js';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const CATEGORY_COLORS = {
  Science: '#3b82f6',
  Geography: '#10b981',
  History: '#f59e0b',
  'Pop Culture': '#ec4899',
};

export default function ResultsScreen({ score, totalQuestions, questions, selectedAnswers, onPlayAgain }) {
  const pct = calcPercentage(score, totalQuestions);
  const { label, emoji } = getGradeLabel(pct);

  return (
    <div className="results-screen">
      <div className="results-hero">
        <div className="results-emoji">{emoji}</div>
        <h2 className="results-grade">{label}</h2>
        <div className="results-score-display">
          <span className="results-fraction">{score} / {totalQuestions}</span>
          <span className="results-pct">{pct}%</span>
        </div>

        <div className="results-bar-track">
          <div
            className="results-bar-fill"
            style={{ width: `${pct}%`, '--pct': pct }}
          />
        </div>
      </div>

      <div className="review-section">
        <h3 className="review-heading">Question Review</h3>
        <div className="review-list">
          {questions.map((q, qi) => {
            const chosen = selectedAnswers[qi];
            const isCorrect = chosen === q.correctIndex;
            const categoryColor = CATEGORY_COLORS[q.category] || '#6366f1';

            return (
              <div key={q.id} className={`review-item ${isCorrect ? 'review-item--correct' : 'review-item--wrong'}`}>
                <div className="review-item-header">
                  <span className="review-q-num">Q{qi + 1}</span>
                  <span
                    className="review-category"
                    style={{ '--badge-color': categoryColor }}
                  >
                    {q.category}
                  </span>
                  <span className="review-result-icon">
                    {isCorrect
                      ? <CheckCircle size={18} color="#10b981" />
                      : <XCircle size={18} color="#ef4444" />}
                  </span>
                </div>
                <p className="review-question">{q.question}</p>
                <div className="review-answers">
                  {q.options.map((opt, oi) => {
                    const isChosen = oi === chosen;
                    const isCorrectOpt = oi === q.correctIndex;
                    let cls = 'review-opt';
                    if (isCorrectOpt) cls += ' review-opt--correct';
                    else if (isChosen && !isCorrectOpt) cls += ' review-opt--wrong';
                    return (
                      <span key={oi} className={cls}>
                        <span className="review-opt-label">{OPTION_LABELS[oi]}</span>
                        {opt}
                        {isChosen && !isCorrectOpt && <XCircle size={13} />}
                        {isCorrectOpt && <CheckCircle size={13} />}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="results-actions">
        <button className="btn-primary btn-large" onClick={onPlayAgain}>
          <RotateCcw size={18} />
          Play Again
        </button>
      </div>
    </div>
  );
}
