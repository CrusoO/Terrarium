import StatusBadge from './StatusBadge'

type ItemCardItem = {
  id: string
  name: string
  status: string
  note: string
}

export default function ItemCard({
  item,
  onSelect,
}: {
  item: ItemCardItem
  onSelect: (id: string) => void
}) {
  return (
    <div className="entity-card">
      <button type="button" onClick={() => onSelect(String(item.id ?? ''))}>
        <strong>{String(item.name ?? '')}</strong>
      </button>
      <p>{String(item.note ?? '')}</p>
      <StatusBadge status={String(item.status ?? '')} />
    </div>
  )
}
