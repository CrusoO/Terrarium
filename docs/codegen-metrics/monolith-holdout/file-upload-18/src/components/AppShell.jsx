import React from 'react';
import { BookOpen, Inbox } from 'lucide-react';

export default function AppShell({ children }) {
  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-header-inner">
          <div className="shell-brand">
            <div className="shell-brand-icon">
              <Inbox size={22} strokeWidth={2} />
            </div>
            <div className="shell-brand-text">
              <span className="shell-brand-name">Homework Drop Box</span>
              <span className="shell-brand-sub">Submit your assignments securely</span>
            </div>
          </div>
          <div className="shell-header-badge">
            <BookOpen size={14} strokeWidth={2} />
            <span>Student Portal</span>
          </div>
        </div>
      </header>

      <main className="shell-main">
        <div className="shell-container">
          {children}
        </div>
      </main>

      <footer className="shell-footer">
        <div className="shell-footer-inner">
          <p>© {new Date().getFullYear()} Homework Drop Box &mdash; All submissions are stored locally in your browser.</p>
        </div>
      </footer>
    </div>
  );
}
