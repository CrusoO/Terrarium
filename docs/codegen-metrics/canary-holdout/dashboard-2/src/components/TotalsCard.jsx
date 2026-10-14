/**
 * TotalsCard: leaf component that renders the daily totals grid.
 * @param {Object} props
 * @param {Array<Object>} props.totals - DailyTotal[] from useTotals(), never a single row.
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <section className="totals-grid">
      {rows.length === 0 ? (
        <p>No totals to show.</p>
      ) : (
        rows.map((row, index) => (
          <div className="entity-card" key={row.date ?? index}>
            <strong>{row.date ?? row.label ?? `Day ${index + 1}`}</strong>
            <span>{row.total ?? row.count ?? 0}</span>
          </div>
        ))
      )}
    </section>
  )
}
