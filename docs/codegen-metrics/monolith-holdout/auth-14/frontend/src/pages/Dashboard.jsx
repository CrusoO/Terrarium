import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  function handleSignOut() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/signin');
  }

  if (!user) {
    navigate('/signin');
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-card dashboard-card">
        <div className="success-icon">✓</div>
        <h2 className="auth-title" style={{ textAlign: 'center' }}>Signed in successfully</h2>
        <div className="user-info">
          <div className="user-avatar">
            <User size={24} />
          </div>
          <div>
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={handleSignOut}>
          <span className="btn-content">
            <LogOut size={16} />
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
}
