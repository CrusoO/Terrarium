import StatusBadge from './StatusBadge'
import { useItems } from '../hooks/useData.ts'

type Item = ReturnType<typeof useItems>[number]

export default function ItemCard({
  item,
  onSelect,
}: {
  item: Item
  onSelect: (id: string) => void
}) {
  return (
    <div className="entity-card" onClick={() => onSelect(String(item.id ?? ''))}>
      <h3>{String(item.name ?? '')}</h3>
      <StatusBadge status={String(item.status ?? '')} />
      <p>{String(item.note ?? '')}</p>
    </div>
  )
}
