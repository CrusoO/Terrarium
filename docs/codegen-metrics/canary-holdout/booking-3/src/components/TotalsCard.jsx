/**
 * Renders the daily totals grid. Expects the array returned by useTotals().
 * @param {{ totals: import('../types').DailyTotal[] }} props
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((row, index) => {
        const label = row.date ?? row.day ?? ''
        const value = row.total ?? row.amount ?? 0
        return (
          <div className="entity-card" key={label || index}>
            <div>{label}</div>
            <div>{value}</div>
          </div>
        )
      })}
    </div>
  )
}
