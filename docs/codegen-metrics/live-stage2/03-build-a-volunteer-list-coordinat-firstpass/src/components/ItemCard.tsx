import StatusBadge from './StatusBadge'

interface CardItem {
  id: string
  name: string
  status: string
  note: string
}

interface ItemCardProps {
  item: CardItem
  onSelect: (id: string) => void
}

export default function ItemCard({ item, onSelect }: ItemCardProps) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(String(item.id ?? ''))}
    >
      <strong>{String(item.name ?? '')}</strong>
      <StatusBadge status={String(item.status ?? '')} />
      <p>{String(item.note ?? '')}</p>
    </button>
  )
}
