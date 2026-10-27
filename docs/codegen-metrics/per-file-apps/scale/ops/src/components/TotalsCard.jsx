import React from 'react';

/**
 * @typedef {Object} DailyTotal
 * @property {string} [date]
 * @property {string} [dueDate]
 * @property {number} [count]
 * @property {number} [total]
 */

/**
 * Renders a grid of daily totals. Receives the full DailyTotal[] array from useTotals().
 *
 * @param {Object} props
 * @param {DailyTotal[]} props.totals
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((entry, index) => {
        const label = entry.date ?? entry.dueDate ?? `Day ${index + 1}`;
        const value = entry.count ?? entry.total ?? 0;

        return (
          <div className="entity-card" key={`${label}-${index}`}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
}
