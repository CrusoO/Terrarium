import React from 'react';

/**
 * Reusable card wrapper for chart panels.
 * Props: title, subtitle, children
 */
export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h2 className="chart-card-title">{title}</h2>
        {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
      </div>
      <div className="chart-card-body">
        {children}
      </div>
    </div>
  );
}
