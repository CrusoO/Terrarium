import { useTotals } from '../hooks/useData.ts'

type DailyTotal = ReturnType<typeof useTotals>[number]

type Props = {
  totals: DailyTotal[]
  onOpen?: (id: string) => void
  onDone?: () => void
}

export default function TotalsCard({ totals }: Props) {
  const rows = Array.isArray(totals) ? totals : []
  return (
    <div className="totals-grid">
      {rows.map((t, i) => (
        <div key={i} className="entity-card">
          {Object.entries(t).map(([k, v]) => (
            <div key={k}>
              <span>{k}: </span>
              <span>{String(v ?? '')}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
