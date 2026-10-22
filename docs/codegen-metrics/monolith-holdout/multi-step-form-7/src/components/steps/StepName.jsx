import React, { useRef, useEffect } from 'react';

export default function StepName({ wizard }) {
  const { name, setName, goNext } = wizard;
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) goNext();
  };

  const isValid = name.trim().length > 0;

  return (
    <form className="step-form" onSubmit={handleSubmit} noValidate>
      <div className="step-intro">
        <h2 className="step-heading">What's your name?</h2>
        <p className="step-description">We'll use this to personalise your experience.</p>
      </div>

      <div className="field-group">
        <label htmlFor="full-name" className="field-label">
          Full name
        </label>
        <input
          ref={inputRef}
          id="full-name"
          type="text"
          className="field-input"
          placeholder="e.g. Alex Johnson"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          aria-required="true"
          aria-describedby="name-hint"
        />
        <p id="name-hint" className="field-hint">
          Enter your first and last name.
        </p>
      </div>

      <div className="step-actions step-actions--right">
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
