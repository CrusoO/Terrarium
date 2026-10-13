import React from 'react';

export default function StepConfirm({ wizard }) {
  const { name, team, goBack, submit } = wizard;

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  return (
    <form className="step-form" onSubmit={handleSubmit} noValidate>
      <div className="step-intro">
        <h2 className="step-heading">Looks good — confirm your details</h2>
        <p className="step-description">Review your information before finishing setup.</p>
      </div>

      <div className="confirm-card">
        <div className="confirm-row">
          <div className="confirm-field">
            <span className="confirm-label">Full name</span>
            <span className="confirm-value">{name}</span>
          </div>
          <div className="confirm-divider" aria-hidden="true" />
          <div className="confirm-field">
            <span className="confirm-label">Team</span>
            <span className="confirm-value">{team}</span>
          </div>
        </div>
      </div>

      <p className="confirm-note">
        By clicking <strong>Finish setup</strong>, your profile will be created and you'll be taken to your dashboard.
      </p>

      <div className="step-actions step-actions--split">
        <button type="button" className="btn btn-ghost" onClick={goBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <button type="submit" className="btn btn-success">
          Finish setup
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2.5 8.5L6 12L13.5 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
