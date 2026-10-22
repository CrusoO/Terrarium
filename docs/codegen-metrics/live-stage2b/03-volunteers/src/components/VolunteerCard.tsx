import StatusBadge from './StatusBadge.tsx'
import type { Volunteer } from '../types.ts'

type VolunteerCardProps = {
  item: Volunteer
  onSelect: (id: string) => void
}

export default function VolunteerCard({ item, onSelect }: VolunteerCardProps) {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      <div>
        <span>id: </span>
        <span>{String(item.id ?? '')}</span>
      </div>
      <div>
        <span>name: </span>
        <span>{String(item.name ?? '')}</span>
      </div>
      <div>
        <span>role: </span>
        <span>{String(item.role ?? '')}</span>
      </div>
      <div>
        <span>status: </span>
        <StatusBadge status={String(item.status ?? '')} />
      </div>
      <div>
        <span>shift: </span>
        <span>{String(item.shift ?? '')}</span>
      </div>
    </button>
  )
}
