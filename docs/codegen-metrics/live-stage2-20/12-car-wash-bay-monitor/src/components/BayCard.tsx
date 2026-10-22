import StatusBadge from './StatusBadge'

type BayItem = {
  id: string
  bayNumber: number
  status: string
  currentVehicle: string
  washesCompletedToday: number
  timeStarted: string
}

type BayCardProps = {
  item: BayItem
  onSelect: (id: string) => void
  onOpen?: (id: string) => void
  onDone?: () => void
}

export default function BayCard({ item, onSelect }: BayCardProps) {
  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(item.id)
      }}
    >
      <div>
        <span className="label">id: </span>
        <span className="value">{String(item.id ?? '')}</span>
      </div>
      <div>
        <span className="label">bayNumber: </span>
        <span className="value">{String(item.bayNumber ?? '')}</span>
      </div>
      <div>
        <span className="label">status: </span>
        <StatusBadge status={String(item.status ?? '')} />
      </div>
      <div>
        <span className="label">currentVehicle: </span>
        <span className="value">{String(item.currentVehicle ?? '')}</span>
      </div>
      <div>
        <span className="label">washesCompletedToday: </span>
        <span className="value">{String(item.washesCompletedToday ?? '')}</span>
      </div>
      <div>
        <span className="label">timeStarted: </span>
        <span className="value">{String(item.timeStarted ?? '')}</span>
      </div>
    </div>
  )
}
