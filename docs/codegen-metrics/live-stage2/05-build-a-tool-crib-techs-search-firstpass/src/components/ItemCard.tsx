import StatusBadge from './StatusBadge'

type ItemCardProps = {
  item: { id: string; name: string; status: string; note: string }
  onSelect: (id: string) => void
}

export default function ItemCard({ item, onSelect }: ItemCardProps) {
  const handleClick = () => {
    onSelect(item.id)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(item.id)
    }
  }

  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="entity-card-header">
        <span className="entity-card-id">{String(item.id ?? '')}</span>
        <StatusBadge status={String(item.status ?? '')} />
      </div>
      <div className="entity-card-name">{String(item.name ?? '')}</div>
      <div className="entity-card-note">{String(item.note ?? '')}</div>
    </div>
  )
}
