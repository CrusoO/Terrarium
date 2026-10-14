/**
 * TotalsCard renders the daily totals returned by useTotals().
 * It is a leaf component: it receives the full DailyTotal[] array and does not fetch data.
 *
 * @param {object} props
 * @param {Array<Record<string, unknown>>} props.totals - DailyTotal[] from useTotals().
 * @returns {JSX.Element}
 */
export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={index}>
          {Object.entries(row).map(([label, value]) => (
            <div key={label}>
              <span>{label}: </span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
