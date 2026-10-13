import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ShieldCheck, Activity, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="dashboard">
      {/* Top nav */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-brand">
            <ShieldCheck size={22} strokeWidth={2} />
            <span>AuthFlow</span>
          </div>
          <div className="dash-header-right">
            <button className="dash-icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="dash-avatar" aria-label="User avatar">
              {initials}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="dash-main">
        <div className="dash-welcome">
          <h1>Good to see you, {currentUser?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p>You're signed in as <strong>{currentUser?.email}</strong></p>
        </div>

        {/* Stats row */}
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-icon stat-icon--blue">
              <User size={20} />
            </div>
            <div>
              <div className="stat-value">1</div>
              <div className="stat-label">Active session</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--green">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="stat-value">Secure</div>
              <div className="stat-label">Account status</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--purple">
              <Activity size={20} />
            </div>
            <div>
              <div className="stat-value">Just now</div>
              <div className="stat-label">Last sign-in</div>
            </div>
          </div>
        </div>

        {/* Profile card */}
        <div className="dash-profile-card">
          <h2>Account details</h2>
          <div className="profile-row">
            <span className="profile-label">Name</span>
            <span className="profile-value">{currentUser?.name}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{currentUser?.email}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">User ID</span>
            <span className="profile-value profile-value--mono">{currentUser?.id}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
