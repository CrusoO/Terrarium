import type { ReactElement } from 'react'
import type { useTotals } from '../hooks/useData.ts'

type DailyTotal = ReturnType<typeof useTotals>[number]

type TotalsCardProps = {
  totals: DailyTotal[]
  onOpen?: (id: string) => void
  onDone?: () => void
}

export default function TotalsCard({ totals }: TotalsCardProps): ReactElement {
  const rows = Array.isArray(totals) ? totals : []

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div key={index} className="entity-card">
          {Object.entries(row).map(([name, value]) => (
            <div key={name}>
              <span>{name}: </span>
              <span>{String(value ?? '')}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
