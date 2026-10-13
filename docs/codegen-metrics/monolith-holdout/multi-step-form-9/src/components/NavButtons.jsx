import React from 'react';

export default function NavButtons({
  step,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  nextLabel = 'Next',
  submitLabel = 'Submit Registration',
  isLastStep,
}) {
  return (
    <div className="nav-buttons">
      {step > 1 && (
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
      )}
      <div className="nav-right">
        {isLastStep ? (
          <button type="button" className="btn btn-primary btn-submit" onClick={onSubmit}>
            {submitLabel}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {nextLabel} →
          </button>
        )}
      </div>
    </div>
  );
}
