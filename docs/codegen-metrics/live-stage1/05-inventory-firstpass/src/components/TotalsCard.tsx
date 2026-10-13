import { useTotals } from '../hooks/useData.ts'

type DailyTotal = ReturnType<typeof useTotals>[number]

export default function TotalsCard({ totals }: { totals: DailyTotal[] }) {
  const rows = Array.isArray(totals) ? totals : []
  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div key={index} className="entity-card">
          {Object.entries(row ?? {}).map(([key, value]) => (
            <span key={key}>
              {key}: {String(value ?? '')}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
