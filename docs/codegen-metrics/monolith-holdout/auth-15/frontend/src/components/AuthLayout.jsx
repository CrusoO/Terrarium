import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Centered card shell shared by all auth pages.
 * Renders a logo/brand header above the card content.
 */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <ShieldCheck size={28} strokeWidth={2} />
          </div>
          <span className="auth-brand-name">AuthFlow</span>
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>

        {/* Form content */}
        <div className="auth-body">{children}</div>
      </div>
    </div>
  );
}
