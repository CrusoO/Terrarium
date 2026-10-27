import React from 'react';

/**
 * @typedef {Object<string, *>} DailyTotal
 */

/**
 * Renders the daily totals grid.
 * @param {{ totals: DailyTotal[] }} props
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <section className="totals-grid">
      {rows.map((total, index) => (
        <div className="entity-card" key={index}>
          {Object.entries(total).map(([field, value]) => (
            <p key={field}>
              <strong>{field}: </strong>
              <span>{String(value)}</span>
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}
