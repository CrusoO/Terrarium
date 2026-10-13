import React from 'react';
import { Check } from 'lucide-react';

/**
 * Visual 1-2-3 progress indicator for the wizard.
 * Shows completed, active, and upcoming steps.
 */
export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="step-indicator" role="navigation" aria-label="Wizard progress">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <React.Fragment key={label}>
            <div className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
              <div className="step-circle" aria-current={isActive ? 'step' : undefined}>
                {isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="step-label">{label}</span>
            </div>

            {index < steps.length - 1 && (
              <div className={`step-connector ${isCompleted ? 'completed' : ''}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
