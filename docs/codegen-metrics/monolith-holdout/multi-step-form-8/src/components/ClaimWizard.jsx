import React from 'react';
import { useClaimForm } from '../hooks/useClaimForm.js';
import StepIndicator from './StepIndicator.jsx';
import Step1Date from './Step1Date.jsx';
import Step2Amount from './Step2Amount.jsx';
import Step3Review from './Step3Review.jsx';
import { formatDate, formatCurrency } from '../utils/helpers.js';

/**
 * Top-level wizard orchestrator. Manages step rendering and
 * shows the confirmation screen after successful submission.
 */
export default function ClaimWizard() {
  const {
    currentStep,
    claimDate,
    setClaimDate,
    claimAmount,
    setClaimAmount,
    dateError,
    amountError,
    submitted,
    goToStep2,
    goToStep3,
    goBack,
    submitClaim,
    resetForm,
  } = useClaimForm();

  if (submitted) {
    return (
      <div className="wizard-card">
        <div className="confirmation-screen" role="status" aria-live="polite">
          <div className="confirmation-icon" aria-hidden="true">✓</div>
          <h2 className="confirmation-title">Claim Submitted!</h2>
          <p className="confirmation-message">
            Your claim has been received and is being processed.
          </p>
          <div className="confirmation-summary">
            <div className="confirmation-detail">
              <span className="confirmation-detail-label">Incident Date</span>
              <span className="confirmation-detail-value">{formatDate(claimDate)}</span>
            </div>
            <div className="confirmation-detail">
              <span className="confirmation-detail-label">Claim Amount</span>
              <span className="confirmation-detail-value">{formatCurrency(claimAmount)}</span>
            </div>
          </div>
          <p className="confirmation-ref">
            Reference ID: <strong>CLM-{Date.now().toString().slice(-8)}</strong>
          </p>
          <button className="btn btn-primary" onClick={resetForm}>
            Start a New Claim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-card">
      <div className="wizard-header">
        <h1 className="wizard-title">File a Claim</h1>
        <p className="wizard-subtitle">Complete all steps to submit your claim.</p>
      </div>

      <StepIndicator currentStep={currentStep} />

      <div className="wizard-body">
        {currentStep === 1 && (
          <Step1Date
            claimDate={claimDate}
            setClaimDate={setClaimDate}
            dateError={dateError}
            onNext={goToStep2}
          />
        )}
        {currentStep === 2 && (
          <Step2Amount
            claimAmount={claimAmount}
            setClaimAmount={setClaimAmount}
            amountError={amountError}
            onNext={goToStep3}
            onBack={goBack}
          />
        )}
        {currentStep === 3 && (
          <Step3Review
            claimDate={claimDate}
            claimAmount={claimAmount}
            onBack={goBack}
            onSubmit={submitClaim}
          />
        )}
      </div>
    </div>
  );
}
