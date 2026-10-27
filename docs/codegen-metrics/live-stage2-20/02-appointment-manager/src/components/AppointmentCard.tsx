import { useAppointments } from '../hooks/useData.ts'
import StatusBadge from './StatusBadge'

type Appointment = ReturnType<typeof useAppointments>[number]

export interface AppointmentCardProps {
  item: Appointment
  onSelect: (id: string) => void
}

const FIELDS: (keyof Appointment)[] = [
  'id',
  'clientName',
  'dateTime',
  'duration',
  'serviceType',
  'notes',
]

export default function AppointmentCard({ item, onSelect }: AppointmentCardProps) {
  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onSelect(item.id)
        }
      }}
    >
      {FIELDS.map((field) => (
        <div key={field}>
          <span className="field-label">{field}: </span>
          <span>{String(item[field] ?? '')}</span>
        </div>
      ))}
      <div>
        <span className="field-label">status: </span>
        <StatusBadge status={String(item.status ?? '')} />
      </div>
    </div>
  )
}
