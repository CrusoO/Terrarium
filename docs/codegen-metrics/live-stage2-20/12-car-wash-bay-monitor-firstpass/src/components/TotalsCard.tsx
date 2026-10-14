type TotalRow = Record<string, unknown>

type TotalsCardProps = {
  totals: TotalRow[]
  onOpen?: (id: string) => void
  onDone?: () => void
}

export default function TotalsCard({ totals }: TotalsCardProps) {
  const rows = Array.isArray(totals) ? totals : []
  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div key={index} className="entity-card">
          {Object.keys(row).map((key) => (
            <div key={key}>
              <span className="label">{key}: </span>
              <span className="value">{String(row[key] ?? '')}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
