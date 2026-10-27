import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';

function validate(email, password) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { request } = useApi();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate(email, password);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="alert alert--error" role="alert">
            {serverError}
          </div>
        )}

        <FormField
          label="Email address"
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
        />

        <FormField
          label="Password"
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="form-forgot-row">
          <Link to="/forgot-password" className="link">
            Forgot your password?
          </Link>
        </div>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-footer-text">
        Don't have an account?{' '}
        <Link to="/register" className="link link--bold">
          Create one
        </Link>
      </p>

      <div className="demo-hint">
        <strong>Demo credentials:</strong> demo@example.com / password123
      </div>
    </AuthLayout>
  );
}
