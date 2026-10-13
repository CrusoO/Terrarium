import React from 'react';

export default function StatCard({ icon, label, value, unit, color, note, progress }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card-top">
        <div className={`stat-icon stat-icon--${color}`}>{icon}</div>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value-row">
        <span className="stat-value">{value}</span>
        <span className="stat-unit">{unit}</span>
      </div>
      <div className="stat-progress-track">
        <div
          className={`stat-progress-fill stat-progress-fill--${color}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="stat-note">{note}</p>
    </div>
  );
}
