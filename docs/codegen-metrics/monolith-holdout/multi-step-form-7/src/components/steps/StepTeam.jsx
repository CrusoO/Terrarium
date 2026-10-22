import React from 'react';
import { TEAMS } from '../../hooks/useWizard.js';

const TEAM_ICONS = {
  Engineering: '⚙️',
  Design: '🎨',
  Marketing: '📣',
  Product: '🧩',
  Operations: '📋',
};

export default function StepTeam({ wizard }) {
  const { team, setTeam, goNext, goBack } = wizard;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (team) goNext();
  };

  const isValid = team.length > 0;

  return (
    <form className="step-form" onSubmit={handleSubmit} noValidate>
      <div className="step-intro">
        <h2 className="step-heading">Which team are you joining?</h2>
        <p className="step-description">Select the team that best describes your role.</p>
      </div>

      <fieldset className="team-fieldset" aria-label="Select your team">
        <legend className="field-label">Team</legend>
        <div className="team-grid">
          {TEAMS.map((t) => (
            <label
              key={t}
              className={`team-card ${team === t ? 'selected' : ''}`}
              htmlFor={`team-${t}`}
            >
              <input
                type="radio"
                id={`team-${t}`}
                name="team"
                value={t}
                checked={team === t}
                onChange={() => setTeam(t)}
                className="team-radio"
              />
              <span className="team-icon" aria-hidden="true">{TEAM_ICONS[t]}</span>
              <span className="team-name">{t}</span>
              {team === t && (
                <span className="team-check" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="step-actions step-actions--split">
        <button type="button" className="btn btn-ghost" onClick={goBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValid}
          aria-disabled={!isValid}
        >
          Continue
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
