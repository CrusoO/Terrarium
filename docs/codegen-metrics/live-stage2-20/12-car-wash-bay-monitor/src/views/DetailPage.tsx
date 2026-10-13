import { useSelectedBay } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedBay()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Bay</p><h2>{item.bayNumber || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>bayNumber</strong> {String(item.bayNumber ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>currentVehicle</strong> {String(item.currentVehicle ?? '')}</p>
        <p><strong>washesCompletedToday</strong> {String(item.washesCompletedToday ?? '')}</p>
        <p><strong>timeStarted</strong> {String(item.timeStarted ?? '')}</p>
    </article>
  )
}
