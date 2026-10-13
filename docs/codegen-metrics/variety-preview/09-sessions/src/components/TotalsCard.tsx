import type { DailyTotal } from '../types.ts'
export default function TotalsCard({ totals }: { totals: DailyTotal[] }) {
  return <div className="totals-grid">{(totals || []).map((row) => <p key={row.date}>{row.date}: {row.count}</p>)}</div>
}
