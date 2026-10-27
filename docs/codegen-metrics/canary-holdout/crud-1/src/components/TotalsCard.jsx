import React from 'react'

/**
 * Shows one card per daily total in a grid.
 *
 * @param {Object} props
 * @param {DailyTotal[]} props.totals - Array of daily totals from useTotals().
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row.date ?? index}>
          <div>{row.date ?? ''}</div>
          <div>{row.total ?? row.count ?? 0}</div>
        </div>
      ))}
    </div>
  )
}
