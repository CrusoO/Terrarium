/**
 * Renders one card per daily total inside the shared totals grid.
 * @param {{ totals: Array<{ date?: string, count?: number, total?: number }> }} props
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row.date ?? index}>
          <div>{row.date ?? ''}</div>
          <div>{row.count ?? 0}</div>
          <div>{row.total ?? 0}</div>
        </div>
      ))}
    </div>
  )
}
