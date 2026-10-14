import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';

function validate(name, email, password, confirmPassword) {
  const errors = {};
  if (!name.trim()) errors.name = 'Full name is required.';
  else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';

  if (!email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  return errors;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { request } = useApi();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field) => setErrors((p) => ({ ...p, [field]: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate(name, email, password, confirmPassword);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
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
      title="Create an account"
      subtitle="Join AuthFlow — it only takes a minute"
    >
      <form onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="alert alert--error" role="alert">
            {serverError}
          </div>
        )}

        <FormField
          label="Full name"
          id="reg-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
          error={errors.name}
          placeholder="Jane Smith"
          autoComplete="name"
          disabled={loading}
        />

        <FormField
          label="Email address"
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
        />

        <FormField
          label="Password"
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
          error={errors.password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={loading}
        />

        <FormField
          label="Confirm password"
          id="reg-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
          error={errors.confirmPassword}
          placeholder="Repeat your password"
          autoComplete="new-password"
          disabled={loading}
        />

        <button type="submit" className="btn btn--primary btn--full" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-footer-text">
        Already have an account?{' '}
        <Link to="/login" className="link link--bold">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
