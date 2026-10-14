import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function StatusBanner({ type, message, onDismiss }) {
  const isSuccess = type === 'success';

  return (
    <div
      className={`status-banner status-banner--${type}`}
      role="alert"
      aria-live="polite"
    >
      <span className="status-banner__icon">
        {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      </span>
      <span className="status-banner__message">{message}</span>
      {onDismiss && (
        <button
          className="status-banner__close"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
