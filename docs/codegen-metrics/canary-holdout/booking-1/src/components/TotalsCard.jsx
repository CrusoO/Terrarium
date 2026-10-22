import React from 'react'

/**
 * Shows one card per daily total from useTotals().
 * @param {{ totals: DailyTotal[] }} props
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row.date ?? index}>
          <div>{row.date}</div>
          <div>{row.total}</div>
        </div>
      ))}
    </div>
  )
}
