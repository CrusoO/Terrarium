import React from 'react';

export default function SuccessScreen({ name, team, onReset }) {
  return (
    <div className="wizard-card success-card">
      <div className="success-icon-wrap" aria-hidden="true">
        <div className="success-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16L12 22L26 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <h1 className="success-heading">You're all set, {name.split(' ')[0]}!</h1>
      <p className="success-subheading">
        Welcome to the <strong>{team}</strong> team. Your profile has been created and you're ready to go.
      </p>

      <div className="success-summary">
        <div className="success-row">
          <span className="success-key">Name</span>
          <span className="success-val">{name}</span>
        </div>
        <div className="success-row">
          <span className="success-key">Team</span>
          <span className="success-val">{team}</span>
        </div>
      </div>

      <button className="btn btn-primary success-btn" onClick={onReset}>
        Start over
      </button>
    </div>
  );
}
