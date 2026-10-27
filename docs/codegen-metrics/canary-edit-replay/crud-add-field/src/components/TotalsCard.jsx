export default function TotalsCard({ totals }) {
  return <div className="totals-grid">{(totals || []).map((row) => <p key={row.date}>{row.date}: {row.count}</p>)}</div>
}
