import type { ReactElement } from 'react'
import { useItems } from '../hooks/useData.ts'
import StatusBadge from './StatusBadge'

type Item = ReturnType<typeof useItems>[number]

type ItemCardProps = {
  item: Item
  onSelect: (id: string) => void
}

export default function ItemCard({ item, onSelect }: ItemCardProps): ReactElement {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span className="entity-card-name">{String(item.name ?? '')}</span>
      <StatusBadge status={String(item.status ?? '')} />
      <span className="entity-card-note">{String(item.note ?? '')}</span>
    </button>
  )
}
