/**
 * TotalsCard: leaf component that renders per-day totals in the shared totals grid.
 * @param {{ totals: DailyTotal[] }} props
 * @typedef {{ date?: string, spentOn?: string, total?: number, amount?: number }} DailyTotal
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <section className="totals-grid">
      {rows.map((row, index) => {
        const label = row.date ?? row.spentOn ?? String(index)
        const value = row.total ?? row.amount ?? 0
        return (
          <div className="entity-card" key={`${label}-${index}`}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        )
      })}
    </section>
  )
}
