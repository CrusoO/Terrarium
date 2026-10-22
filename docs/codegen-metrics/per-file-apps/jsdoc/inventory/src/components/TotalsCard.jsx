import React from 'react';

/**
 * @typedef {Object<string, unknown>} DailyTotal
 */

/**
 * @typedef {Object} TotalsCardProps
 * @property {DailyTotal[]} totals
 */

/**
 * Renders the daily totals array returned by useTotals().
 * @param {TotalsCardProps} props
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((total, index) => (
        <div className="entity-card" key={index}>
          {Object.entries(total).map(([field, value]) => (
            <div key={field}>
              <strong>{field}</strong>: {String(value)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
