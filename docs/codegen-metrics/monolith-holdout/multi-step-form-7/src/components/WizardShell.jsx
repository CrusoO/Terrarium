import React from 'react';
import StepName from './steps/StepName.jsx';
import StepTeam from './steps/StepTeam.jsx';
import StepConfirm from './steps/StepConfirm.jsx';
import SuccessScreen from './SuccessScreen.jsx';
import { TOTAL_STEPS } from '../hooks/useWizard.js';

const STEP_LABELS = ['Your Name', 'Your Team', 'Confirm'];

export default function WizardShell({ wizard }) {
  const { currentStep, submitted } = wizard;

  if (submitted) {
    return <SuccessScreen name={wizard.name} team={wizard.team} onReset={wizard.reset} />;
  }

  return (
    <div className="wizard-card">
      {/* Header */}
      <div className="wizard-header">
        <p className="wizard-eyebrow">Getting started</p>
        <h1 className="wizard-title">Welcome aboard</h1>
        <p className="wizard-subtitle">Let's get you set up in just a few steps.</p>
      </div>

      {/* Progress indicator */}
      <div className="progress-bar-wrapper" role="list" aria-label="Onboarding steps">
        {STEP_LABELS.map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <React.Fragment key={label}>
              <div
                className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                role="listitem"
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="progress-circle">
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="progress-label">{label}</span>
              </div>
              {idx < TOTAL_STEPS - 1 && (
                <div className={`progress-connector ${isCompleted ? 'filled' : ''}`} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step counter */}
      <p className="step-counter">Step {currentStep + 1} of {TOTAL_STEPS}</p>

      {/* Step content */}
      <div className="wizard-body">
        {currentStep === 0 && <StepName wizard={wizard} />}
        {currentStep === 1 && <StepTeam wizard={wizard} />}
        {currentStep === 2 && <StepConfirm wizard={wizard} />}
      </div>
    </div>
  );
}
