export default function DailyTotalsCard({ totals }) { return <div className="totals-grid">{(totals || []).map((row) => <p key={row.date}>{row.date}: {row.count} / {row.total}</p>)}</div>; }
