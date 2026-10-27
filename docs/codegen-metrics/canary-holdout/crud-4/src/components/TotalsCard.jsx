import React from 'react'

/**
 * Renders a grid of daily totals.
 *
 * @param {Object} props
 * @param {Array<Object>} props.totals - DailyTotal[] from useTotals(). Always the full array, never a single row.
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row.date ?? index}>
          <div>{row.date ?? ''}</div>
          <div>{row.total ?? ''}</div>
        </div>
      ))}
    </div>
  )
}
