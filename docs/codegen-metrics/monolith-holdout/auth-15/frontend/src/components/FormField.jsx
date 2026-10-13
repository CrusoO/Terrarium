import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable labeled input with inline error display.
 * Supports text, email, and password types (password gets a show/hide toggle).
 */
export default function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="form-input-wrap">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`form-input${error ? ' form-input--error' : ''}${isPassword ? ' form-input--password' : ''}`}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
        />
        {isPassword && (
          <button
            type="button"
            className="form-password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
