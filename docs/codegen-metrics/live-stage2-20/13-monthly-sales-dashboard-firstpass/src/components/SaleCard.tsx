import { useSales } from '../hooks/useData.ts'

type Sale = ReturnType<typeof useSales>[number]

type SaleCardProps = {
  item: Sale
  onSelect: (id: string) => void
}

const FIELDS: { key: keyof Sale; label: string }[] = [
  { key: 'id', label: 'id' },
  { key: 'month', label: 'month' },
  { key: 'total', label: 'total' },
  { key: 'year', label: 'year' },
  { key: 'transactionCount', label: 'transactionCount' },
  { key: 'averageOrderValue', label: 'averageOrderValue' },
]

export default function SaleCard({ item, onSelect }: SaleCardProps) {
  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(item.id)
        }
      }}
    >
      {FIELDS.map((f) => (
        <div key={String(f.key)}>
          <span>{f.label}: </span>
          <strong>{String(item[f.key] ?? '')}</strong>
        </div>
      ))}
    </div>
  )
}
