import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import { useApi } from '../hooks/useApi.js';

export default function ForgotPasswordPage() {
  const { request } = useApi();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState(''); // shown in dev for testing

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!email.trim()) { setEmailError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address.'); return; }

    setLoading(true);
    try {
      const data = await request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResetToken(data.resetToken || '');
      setSubmitted(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Check your inbox" subtitle="">
        <div className="success-state">
          <div className="success-icon">
            <MailCheck size={40} strokeWidth={1.5} />
          </div>
          <p className="success-text">
            If <strong>{email}</strong> is registered, a password reset link has been sent. Check your inbox and follow the instructions.
          </p>
          {resetToken && (
            <div className="demo-hint" style={{ marginTop: '16px' }}>
              <strong>Dev shortcut — reset token:</strong>
              <br />
              <Link
                to={`/reset-password?token=${resetToken}`}
                className="link link--bold"
                style={{ wordBreak: 'break-all', fontSize: '13px' }}
              >
                /reset-password?token={resetToken}
              </Link>
            </div>
          )}
          <Link to="/login" className="btn btn--secondary btn--full" style={{ marginTop: '24px', display: 'block', textAlign: 'center' }}>
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="alert alert--error" role="alert">
            {serverError}
          </div>
        )}

        <FormField
          label="Email address"
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
          error={emailError}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
        />

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-footer-text">
        Remembered it?{' '}
        <Link to="/login" className="link link--bold">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
