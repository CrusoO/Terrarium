import StatusBadge from './StatusBadge.tsx'

export interface ItemCardProps {
  item: {
    id: string
    name: string
    status: string
    note: string
  }
  onSelect: (id: string) => void
}

export default function ItemCard({ item, onSelect }: ItemCardProps) {
  const id = String(item.id ?? '')

  return (
    <article className="entity-card" onClick={() => onSelect(id)}>
      <h3>{String(item.name ?? '')}</h3>
      <p>{String(item.note ?? '')}</p>
      <StatusBadge status={String(item.status ?? '')} />
    </article>
  )
}
