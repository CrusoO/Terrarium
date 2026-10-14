import React from 'react';
import { todayISO } from '../utils/helpers.js';

/**
 * Step 1: Collects the incident/claim date from the user.
 * Validates that a date is selected and is not in the future.
 */
export default function Step1Date({ claimDate, setClaimDate, dateError, onNext }) {
  function handleSubmit(e) {
    e.preventDefault();
    onNext();
  }

  return (
    <form className="step-form" onSubmit={handleSubmit} noValidate>
      <div className="step-header">
        <h2 className="step-title">When did the incident occur?</h2>
        <p className="step-description">
          Enter the date of the event or loss you are filing this claim for.
        </p>
      </div>

      <div className="field-group">
        <label htmlFor="claim-date" className="field-label">
          Incident Date <span className="required-mark" aria-hidden="true">*</span>
        </label>
        <input
          id="claim-date"
          type="date"
          className={`field-input ${dateError ? 'field-input--error' : ''}`}
          value={claimDate}
          max={todayISO()}
          onChange={(e) => setClaimDate(e.target.value)}
          aria-required="true"
          aria-describedby={dateError ? 'date-error' : undefined}
          aria-invalid={!!dateError}
        />
        {dateError && (
          <p id="date-error" className="field-error" role="alert">
            <span aria-hidden="true">⚠ </span>{dateError}
          </p>
        )}
      </div>

      <div className="step-actions step-actions--right">
        <button type="submit" className="btn btn-primary">
          Next: Enter Amount
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
