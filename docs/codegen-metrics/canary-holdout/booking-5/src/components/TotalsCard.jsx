/**
 * @typedef {Object} DailyTotal
 * @property {string} [date]
 * @property {number} [total]
 * @property {number} [count]
 */

/**
 * Renders one card per daily total.
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
        <div className="entity-card" key={row && row.date ? row.date : index}>
          <div>{row && row.date ? row.date : ''}</div>
          <div>{row && row.total !== undefined ? row.total : ''}</div>
        </div>
      ))}
    </div>
  );
}
