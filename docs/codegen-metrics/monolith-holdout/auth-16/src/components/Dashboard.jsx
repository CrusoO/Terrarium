import React from 'react';
import { CheckCircle2, LogOut, User } from 'lucide-react';

export default function Dashboard({ onSignOut }) {
  return (
    <div className="dashboard-backdrop">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div className="success-icon">
            <CheckCircle2 size={36} strokeWidth={1.6} />
          </div>
          <h1 className="dashboard-title">Welcome back!</h1>
          <p className="dashboard-subtitle">You're signed in as a member.</p>
        </div>

        <div className="dashboard-body">
          <div className="member-info">
            <div className="member-avatar">
              <User size={22} strokeWidth={1.8} />
            </div>
            <div className="member-details">
              <span className="member-name">Member Account</span>
              <span className="member-status">Active</span>
            </div>
          </div>

          <div className="dashboard-divider" />

          <ul className="access-list">
            <li className="access-item">
              <span className="access-dot" />
              Full access to member content
            </li>
            <li className="access-item">
              <span className="access-dot" />
              Exclusive resources &amp; downloads
            </li>
            <li className="access-item">
              <span className="access-dot" />
              Community forums &amp; discussions
            </li>
          </ul>
        </div>

        <button className="signout-btn" onClick={onSignOut}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
