import { useSelectedAppointment } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedAppointment()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Appointment</p><h2>{item.stylist || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>stylist</strong> {String(item.stylist ?? '')}</p>
        <p><strong>time</strong> {String(item.time ?? '')}</p>
        <p><strong>phone</strong> {String(item.phone ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
    </article>
  )
}
