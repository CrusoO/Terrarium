import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { DEMO_PASSWORD } from '../constants/auth.js';

export default function SignInForm({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    // Simulate a brief async check
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (password === DEMO_PASSWORD) {
        onSuccess();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    }, 600);
  };

  return (
    <div className="signin-backdrop">
      <div className="signin-card">
        {/* Logo / Brand */}
        <div className="signin-brand">
          <div className="brand-icon">
            <ShieldCheck size={28} strokeWidth={1.8} />
          </div>
          <h1 className="brand-title">Members Area</h1>
          <p className="brand-subtitle">Sign in to access your account</p>
        </div>

        {/* Form */}
        <form className="signin-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <div className={`input-wrapper ${error ? 'input-error' : ''}`}>
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="field-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="current-password"
                aria-describedby={error ? 'password-error' : undefined}
                aria-invalid={!!error}
                disabled={isLoading}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Inline error message */}
            {error && (
              <p id="password-error" className="error-message" role="alert">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner" aria-hidden="true" />
            ) : null}
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="hint-text">
          Demo password: <code>member123</code>
        </p>
      </div>
    </div>
  );
}
