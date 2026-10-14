import React from 'react';
import { formatDate, formatCurrency } from '../utils/helpers.js';

/**
 * Step 3: Displays a read-only summary of the collected claim data.
 * User can go back to edit or submit the claim.
 */
export default function Step3Review({ claimDate, claimAmount, onBack, onSubmit }) {
  return (
    <div className="step-form">
      <div className="step-header">
        <h2 className="step-title">Review your claim</h2>
        <p className="step-description">
          Please confirm the details below before submitting your claim.
        </p>
      </div>

      <div className="review-card" role="region" aria-label="Claim summary">
        <div className="review-row">
          <div className="review-field">
            <span className="review-label">Incident Date</span>
            <span className="review-value">{formatDate(claimDate)}</span>
          </div>
          <div className="review-divider" aria-hidden="true" />
          <div className="review-field">
            <span className="review-label">Claim Amount</span>
            <span className="review-value review-value--amount">{formatCurrency(claimAmount)}</span>
          </div>
        </div>
      </div>

      <div className="review-notice">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        <p>By submitting, you confirm that the information provided is accurate and complete.</p>
      </div>

      <div className="step-actions step-actions--split">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <button type="button" className="btn btn-submit" onClick={onSubmit}>
          Submit Claim
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
