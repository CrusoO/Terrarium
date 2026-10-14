import { useClassBookings, useSelectedClassBooking, useClassBookingActions } from '../hooks/useData.ts'
import StatusBadge from './StatusBadge'

type ClassBooking = ReturnType<typeof useClassBookings>[number]

interface ClassBookingCardProps {
  item: ClassBooking
  onSelect: (id: string) => void
}

export default function ClassBookingCard({ item, onSelect }: ClassBookingCardProps) {
  const id = String(item.id ?? '')
  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onSelect(id)
        }
      }}
    >
      <div>
        <span>id: </span>
        <span>{id}</span>
      </div>
      <div>
        <span>memberName: </span>
        <span>{String(item.memberName ?? '')}</span>
      </div>
      <div>
        <span>className: </span>
        <span>{String(item.className ?? '')}</span>
      </div>
      <div>
        <span>classDate: </span>
        <span>{String(item.classDate ?? '')}</span>
      </div>
      <div>
        <span>classTime: </span>
        <span>{String(item.classTime ?? '')}</span>
      </div>
      <div>
        <span>matsAvailable: </span>
        <span>{String(item.matsAvailable ?? '')}</span>
      </div>
      <div>
        <span>status: </span>
        <StatusBadge status={String(item.status ?? '')} />
      </div>
    </div>
  )
}
