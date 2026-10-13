import React from 'react'

/**
 * Shows one card per daily total row.
 * @param {{ totals: DailyTotal[] }} props
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={index}>
          {Object.entries(row ?? {}).map(([field, value]) => (
            <div key={field}>
              <strong>{field}</strong>: {String(value)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
