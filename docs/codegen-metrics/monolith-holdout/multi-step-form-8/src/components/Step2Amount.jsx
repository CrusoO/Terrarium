import React from 'react';

/**
 * Step 2: Collects the monetary amount being claimed.
 * Validates that the value is a positive number within allowed range.
 */
export default function Step2Amount({ claimAmount, setClaimAmount, amountError, onNext, onBack }) {
  function handleSubmit(e) {
    e.preventDefault();
    onNext();
  }

  // Allow only numeric input with up to 2 decimal places
  function handleChange(e) {
    const val = e.target.value;
    // Permit digits, one decimal point, up to 2 decimal places
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setClaimAmount(val);
    }
  }

  return (
    <form className="step-form" onSubmit={handleSubmit} noValidate>
      <div className="step-header">
        <h2 className="step-title">What is the claim amount?</h2>
        <p className="step-description">
          Enter the total dollar amount you are requesting for this claim.
        </p>
      </div>

      <div className="field-group">
        <label htmlFor="claim-amount" className="field-label">
          Claim Amount (USD) <span className="required-mark" aria-hidden="true">*</span>
        </label>
        <div className={`currency-input-wrapper ${amountError ? 'currency-input-wrapper--error' : ''}`}>
          <span className="currency-symbol" aria-hidden="true">$</span>
          <input
            id="claim-amount"
            type="text"
            inputMode="decimal"
            className="field-input field-input--currency"
            value={claimAmount}
            onChange={handleChange}
            placeholder="0.00"
            aria-required="true"
            aria-describedby={amountError ? 'amount-error' : 'amount-hint'}
            aria-invalid={!!amountError}
          />
        </div>
        {amountError ? (
          <p id="amount-error" className="field-error" role="alert">
            <span aria-hidden="true">⚠ </span>{amountError}
          </p>
        ) : (
          <p id="amount-hint" className="field-hint">
            Maximum claim amount: $1,000,000.00
          </p>
        )}
      </div>

      <div className="step-actions step-actions--split">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <button type="submit" className="btn btn-primary">
          Next: Review
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
