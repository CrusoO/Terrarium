import { useAppointments } from '../hooks/useData.ts'
import StatusBadge from './StatusBadge.tsx'

type Appointment = ReturnType<typeof useAppointments>[number]

interface AppointmentCardProps {
  item: Appointment
  onSelect: (id: string) => void
}

export default function AppointmentCard({ item, onSelect }: AppointmentCardProps) {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      <p>
        <strong>id:</strong> <span>{item.id}</span>
      </p>
      <p>
        <strong>stylist:</strong> <span>{item.stylist}</span>
      </p>
      <p>
        <strong>time:</strong> <span>{item.time}</span>
      </p>
      <p>
        <strong>phone:</strong> <span>{item.phone}</span>
      </p>
      <p>
        <strong>status:</strong> <StatusBadge status={item.status} />
      </p>
    </button>
  )
}
