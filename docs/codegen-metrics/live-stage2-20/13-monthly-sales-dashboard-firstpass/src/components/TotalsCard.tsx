import { useTotals } from '../hooks/useData.ts'

type DailyTotal = ReturnType<typeof useTotals>[number]

type TotalsCardProps = {
  totals: DailyTotal[]
}

export default function TotalsCard({ totals }: TotalsCardProps) {
  const rows = Array.isArray(totals) ? totals : []
  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div key={index} className="entity-card">
          {Object.entries(row ?? {}).map(([field, value]) => (
            <div key={field}>
              <span>{field}: </span>
              <strong>{String(value ?? '')}</strong>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
