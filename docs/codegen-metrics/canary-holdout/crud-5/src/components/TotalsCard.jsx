/**
 * TotalsCard: leaf component that renders the daily totals grid.
 * Receives the DailyTotal[] array from useTotals() via the page. Never a single row.
 *
 * @param {{ totals: Array<Record<string, unknown>> }} props
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((total, index) => (
        <div className="entity-card" key={index}>
          {Object.entries(total ?? {}).map(([field, value]) => (
            <div key={field}>
              <strong>{field}</strong>: {String(value)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
