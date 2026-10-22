import React from 'react';

const STEPS = [
  { number: 1, label: 'Contact Info' },
  { number: 2, label: 'Course' },
  { number: 3, label: 'Waiver' },
  { number: 4, label: 'Review' },
];

export default function ProgressBar({ currentStep }) {
  return (
    <div className="progress-bar" role="navigation" aria-label="Registration steps">
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        return (
          <React.Fragment key={step.number}>
            <div
              className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="progress-circle">
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7l3.5 3.5L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span className="progress-label">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`progress-connector ${isCompleted ? 'completed' : ''}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
