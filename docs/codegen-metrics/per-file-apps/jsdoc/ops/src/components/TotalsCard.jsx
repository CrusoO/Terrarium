import React from 'react';

/**
 * Renders a grid of daily totals.
 *
 * @param {Object} props
 * @param {DailyTotal[]} props.totals - Array of daily totals from useTotals().
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((total, index) => (
        <div className="entity-card" key={index}>
          {Object.entries(total ?? {}).map(([field, value]) => (
            <div key={field}>
              <strong>{field}</strong>: {String(value)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
