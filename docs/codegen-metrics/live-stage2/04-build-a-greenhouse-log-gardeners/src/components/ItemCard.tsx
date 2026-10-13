import type { ReactElement } from 'react'
import type { useItems } from '../hooks/useData.ts'
import StatusBadge from './StatusBadge'

type Item = ReturnType<typeof useItems>[number]

export interface ItemCardProps {
  item: Item
  onSelect: (id: string) => void
}

export default function ItemCard({ item, onSelect }: ItemCardProps): ReactElement {
  return (
    <div className="entity-card" onClick={() => onSelect(String(item.id ?? ''))}>
      <h3>{String(item.name ?? '')}</h3>
      <StatusBadge status={String(item.status ?? '')} />
      <p>{String(item.note ?? '')}</p>
    </div>
  )
}
