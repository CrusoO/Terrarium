import React from 'react';

/**
 * StatCard — displays a single weather aggregate metric.
 * Props: icon (emoji string), label, value, unit, accent (CSS color)
 */
export default function StatCard({ icon, label, value, unit, accent }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">
          {value}
          <span className="stat-card__unit">{unit}</span>
        </span>
      </div>
    </div>
  );
}
