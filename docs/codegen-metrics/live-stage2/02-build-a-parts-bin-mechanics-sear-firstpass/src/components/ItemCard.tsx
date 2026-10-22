type ItemCardItem = {
  id: string
  name: string
  status: string
  note: string
}

type ItemCardProps = {
  item: ItemCardItem
  onSelect: (id: string) => void
}

export default function ItemCard({ item, onSelect }: ItemCardProps) {
  const id = String(item.id ?? '')
  const name = String(item.name ?? '')
  const status = String(item.status ?? '')
  const note = String(item.note ?? '')
  const statusClass = `status-${status.toLowerCase()}`

  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(id)}
    >
      <span className="entity-card-id">{id}</span>
      <span className="entity-card-name">{name}</span>
      <span className={statusClass}>{status}</span>
      <span className="entity-card-note">{note}</span>
    </button>
  )
}
