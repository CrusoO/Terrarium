/**
 * Renders a list of daily totals in the shared totals grid.
 *
 * @param {object} props
 * @param {DailyTotal[]} props.totals - Array of daily totals from useTotals().
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row.spentOn ?? index}>
          <span>{row.spentOn}</span>
          <strong>{row.total}</strong>
        </div>
      ))}
    </div>
  );
}
