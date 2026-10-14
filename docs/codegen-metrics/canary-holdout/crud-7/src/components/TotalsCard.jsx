/**
 * Renders the daily totals grid. Receives the full DailyTotal[] array from useTotals().
 * @param {{ totals: Array<Object> }} props
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={index}>
          {Object.entries(row).map(([field, value]) => (
            <div key={field}>
              <span>{field}</span>: <span>{String(value)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
