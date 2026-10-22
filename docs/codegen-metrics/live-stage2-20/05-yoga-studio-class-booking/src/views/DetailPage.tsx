import { useSelectedClassBooking } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedClassBooking()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>ClassBooking</p><h2>{item.memberName || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>memberName</strong> {String(item.memberName ?? '')}</p>
        <p><strong>className</strong> {String(item.className ?? '')}</p>
        <p><strong>classDate</strong> {String(item.classDate ?? '')}</p>
        <p><strong>classTime</strong> {String(item.classTime ?? '')}</p>
        <p><strong>matsAvailable</strong> {String(item.matsAvailable ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
    </article>
  )
}
