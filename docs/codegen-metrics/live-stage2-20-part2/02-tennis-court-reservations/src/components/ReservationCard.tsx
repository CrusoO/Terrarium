import { useReservations } from '../hooks/useData.ts'

type Reservation = ReturnType<typeof useReservations>[number]

type ReservationCardProps = {
  item: Reservation
  onSelect: (id: string) => void
}

export default function ReservationCard({ item, onSelect }: ReservationCardProps) {
  return (
    <article className="entity-card" onClick={() => onSelect(item.id)}>
      <p>
        <span>Id: </span>
        <span>{String(item.id ?? '')}</span>
      </p>
      <p>
        <span>Court: </span>
        <span>{String(item.court ?? '')}</span>
      </p>
      <p>
        <span>Date: </span>
        <span>{String(item.date ?? '')}</span>
      </p>
      <p>
        <span>Start Time: </span>
        <span>{String(item.startTime ?? '')}</span>
      </p>
      <p>
        <span>Neighbor Name: </span>
        <span>{String(item.neighborName ?? '')}</span>
      </p>
      <p>
        <span>Duration: </span>
        <span>{String(item.duration ?? '')}</span>
      </p>
      <p>
        <span>Status: </span>
        <span>{String(item.status ?? '')}</span>
      </p>
    </article>
  )
}
