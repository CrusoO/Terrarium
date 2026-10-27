import React from 'react';

/**
 * KPI summary card.
 * Props: icon (ReactNode), label (string), value (string), trend (string), trendUp (bool)
 */
export default function StatCard({ icon, label, value, trend, trendUp }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
        {trend && (
          <span className={`stat-card__trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? '▲' : '▼'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
