import React from 'react';

const STEPS = [
  { number: 1, label: 'Date' },
  { number: 2, label: 'Amount' },
  { number: 3, label: 'Review' },
];

/**
 * Visual step progress indicator showing 3 numbered steps.
 * Active step is highlighted; completed steps show a check mark.
 */
export default function StepIndicator({ currentStep }) {
  return (
    <div className="step-indicator" role="list" aria-label="Claim wizard progress">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;

        return (
          <React.Fragment key={step.number}>
            <div
              className={`step-item ${isActive ? 'step-active' : ''} ${isCompleted ? 'step-completed' : ''}`}
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="step-circle">
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`step-connector ${isCompleted ? 'connector-filled' : ''}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
