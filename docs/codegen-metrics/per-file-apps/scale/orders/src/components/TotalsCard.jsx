/**
 * @typedef {Object} DailyTotal
 * @property {string} [date]
 * @property {number} [total]
 * @property {number} [count]
 */

/**
 * Renders the daily totals summary grid.
 *
 * @param {Object} props
 * @param {DailyTotal[]} props.totals - Array of daily totals from useTotals().
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row.date ?? index}>
          <h3>{row.date ?? `Day ${index + 1}`}</h3>
          {row.count !== undefined && <p>Orders: {row.count}</p>}
          {row.total !== undefined && <p>Total: {row.total}</p>}
        </div>
      ))}
    </div>
  );
}
