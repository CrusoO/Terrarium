import StatusBadge from './StatusBadge.tsx'
import { useVenueRequests } from '../hooks/useData.ts'

type VenueRequest = ReturnType<typeof useVenueRequests>[number]

export default function VenueRequestCard({
  item,
  onSelect,
}: {
  item: VenueRequest
  onSelect: (id: string) => void
}) {
  return (
    <div className="entity-card" onClick={() => onSelect(item.id)}>
      <div>
        <span>id: </span>
        <strong>{String(item.id ?? '')}</strong>
      </div>
      <div>
        <span>preferredDate: </span>
        <span>{String(item.preferredDate ?? '')}</span>
      </div>
      <div>
        <span>guestCount: </span>
        <span>{String(item.guestCount ?? '')}</span>
      </div>
      <div>
        <span>cateringStyle: </span>
        <span>{String(item.cateringStyle ?? '')}</span>
      </div>
      <div>
        <span>coupleEmail: </span>
        <span>{String(item.coupleEmail ?? '')}</span>
      </div>
      <div>
        <span>couplePhone: </span>
        <span>{String(item.couplePhone ?? '')}</span>
      </div>
      <div>
        <span>stage: </span>
        <StatusBadge status={String(item.stage ?? '')} />
      </div>
    </div>
  )
}
