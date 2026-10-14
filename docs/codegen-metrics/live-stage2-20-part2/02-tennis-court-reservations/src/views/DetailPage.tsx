import { useSelectedReservation } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedReservation()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Reservation</p><h2>{item.court || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>court</strong> {String(item.court ?? '')}</p>
        <p><strong>date</strong> {String(item.date ?? '')}</p>
        <p><strong>startTime</strong> {String(item.startTime ?? '')}</p>
        <p><strong>neighborName</strong> {String(item.neighborName ?? '')}</p>
        <p><strong>duration</strong> {String(item.duration ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
    </article>
  )
}
