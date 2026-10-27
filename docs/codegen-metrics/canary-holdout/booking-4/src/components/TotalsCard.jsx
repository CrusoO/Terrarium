import React from 'react'

/**
 * Renders a grid of daily totals.
 * @param {{ totals: Array<object> }} props
 * @param {Array<object>} props.totals - DailyTotal[] from useTotals(). Never a single row.
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row.date ?? index}>
          {row.date !== undefined && <p>{String(row.date)}</p>}
          {row.total !== undefined && <p>{String(row.total)}</p>}
        </div>
      ))}
    </div>
  )
}
