/**
 * Renders one card per daily total, laid out in the shared totals grid.
 * @param {{ totals: DailyTotal[] }} props
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];
  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row.date ?? index}>
          <span>{row.date ?? ''}</span>
          <strong>{row.total ?? row.count ?? 0}</strong>
        </div>
      ))}
    </div>
  );
}
