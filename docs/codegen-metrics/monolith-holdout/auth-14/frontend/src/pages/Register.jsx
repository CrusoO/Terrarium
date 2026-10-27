import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="success-icon">✓</div>
          <h2 className="auth-title" style={{ textAlign: 'center' }}>Account created!</h2>
          <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            Welcome aboard. You can now sign in with your new credentials.
          </p>
          <Link to="/signin" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">✨</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Join us today — it's free</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Name Field */}
          <div className={`form-group ${fieldErrors.name ? 'has-error' : ''}`}>
            <label htmlFor="name" className="form-label">Full name</label>
            <div className="input-wrapper">
              <span className="input-icon"><User size={16} /></span>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: '' }));
                }}
                autoComplete="name"
              />
            </div>
            {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
          </div>

          {/* Email Field */}
          <div className={`form-group ${fieldErrors.email ? 'has-error' : ''}`}>
            <label htmlFor="reg-email" className="form-label">Email address</label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={16} /></span>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: '' }));
                }}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          {/* Password Field */}
          <div className={`form-group ${fieldErrors.password ? 'has-error' : ''}`}>
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Lock size={16} /></span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: '' }));
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>

          <button type="submit" className="btn-primary">
            <span className="btn-content">
              <UserPlus size={16} />
              Create Account
            </span>
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/signin" className="auth-link">
            <ArrowLeft size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
