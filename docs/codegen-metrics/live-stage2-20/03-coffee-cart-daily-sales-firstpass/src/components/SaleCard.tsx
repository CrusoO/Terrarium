import type { ReactElement } from 'react'
import type { useSales } from '../hooks/useData.ts'

type Sale = ReturnType<typeof useSales>[number]

type SaleCardProps = {
  item: Sale
  onSelect: (id: string) => void
  onOpen?: (id: string) => void
  onDone?: () => void
}

const FIELDS: Array<keyof Sale> = [
  'id',
  'drinkType',
  'quantity',
  'hour',
  'price',
  'timestamp',
  'status',
]

export default function SaleCard({ item, onSelect }: SaleCardProps): ReactElement {
  return (
    <div className="entity-card" onClick={() => onSelect(item.id)}>
      {FIELDS.map((field) => (
        <div key={String(field)}>
          <span>{String(field)}: </span>
          <span>{String(item[field] ?? '')}</span>
        </div>
      ))}
    </div>
  )
}
