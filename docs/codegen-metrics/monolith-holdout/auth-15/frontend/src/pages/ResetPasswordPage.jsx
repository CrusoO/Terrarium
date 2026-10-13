import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import { useApi } from '../hooks/useApi.js';

function validate(password, confirmPassword) {
  const errors = {};
  if (!password) errors.password = 'New password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your new password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { request } = useApi();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate(password, confirmPassword);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!token) {
      setServerError('Reset token is missing. Please use the link from your email.');
      return;
    }

    setLoading(true);
    try {
      await request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      });
      setSuccess(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password updated" subtitle="">
        <div className="success-state">
          <div className="success-icon success-icon--green">
            <CheckCircle size={40} strokeWidth={1.5} />
          </div>
          <p className="success-text">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <Link to="/login" className="btn btn--primary btn--full" style={{ marginTop: '24px', display: 'block', textAlign: 'center' }}>
            Sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your account"
    >
      {!token && (
        <div className="alert alert--warning" role="alert">
          No reset token found. Please use the link from your email or{' '}
          <Link to="/forgot-password" className="link">request a new one</Link>.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="alert alert--error" role="alert">
            {serverError}
          </div>
        )}

        <FormField
          label="New password"
          id="reset-password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
          error={errors.password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={loading || !token}
        />

        <FormField
          label="Confirm new password"
          id="reset-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
          error={errors.confirmPassword}
          placeholder="Repeat your new password"
          autoComplete="new-password"
          disabled={loading || !token}
        />

        <button type="submit" className="btn btn--primary btn--full" disabled={loading || !token}>
          {loading ? 'Updating password…' : 'Update password'}
        </button>
      </form>

      <p className="auth-footer-text">
        <Link to="/login" className="link link--bold">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
