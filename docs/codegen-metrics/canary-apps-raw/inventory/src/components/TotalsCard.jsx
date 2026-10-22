/**
 * TotalsCard: leaf view of the daily totals array from useTotals().
 * Receives the whole DailyTotal[] array, never a single row.
 * @param {{ totals: DailyTotal[] }} props
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <section className="totals-grid" aria-label="Daily totals">
      {rows.map((total, index) => (
        <div className="entity-card" key={index}>
          {Object.entries(total ?? {}).map(([field, value]) => (
            <p key={field}>
              <span>{field}</span>: <strong>{String(value)}</strong>
            </p>
          ))}
        </div>
      ))}
    </section>
  )
}
