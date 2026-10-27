/**
 * @typedef {Object} DailyTotal
 * @property {string} date
 * @property {number} count
 */

/**
 * Renders one card per daily total inside the scaffold totals grid.
 *
 * @param {Object} props
 * @param {DailyTotal[]} props.totals
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row.date ?? index}>
          <span>{row.date}</span>
          <strong>{row.count}</strong>
        </div>
      ))}
    </div>
  );
}
