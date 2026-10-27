import type { ReactElement } from 'react'
import { useTotals } from '../hooks/useData.ts'

type DailyTotal = ReturnType<typeof useTotals>[number]

export default function TotalsCard({ totals }: { totals: DailyTotal[] }): ReactElement {
  const rows = Array.isArray(totals) ? totals : []
  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div key={index}>
          {Object.entries(row ?? {}).map(([key, value]) => (
            <div key={key}>
              <span>{key}: </span>
              <span>{String(value ?? '')}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
