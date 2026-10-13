import { useSelectedAppointment } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedAppointment()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Appointment</p><h2>{item.clientName || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>clientName</strong> {String(item.clientName ?? '')}</p>
        <p><strong>dateTime</strong> {String(item.dateTime ?? '')}</p>
        <p><strong>duration</strong> {String(item.duration ?? '')}</p>
        <p><strong>serviceType</strong> {String(item.serviceType ?? '')}</p>
        <p><strong>notes</strong> {String(item.notes ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
    </article>
  )
}
