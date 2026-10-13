import { useSelectedSession } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedSession()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Session</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>producer</strong> {String(item.producer ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>hours</strong> {String(item.hours ?? '')}</p>
    </article>
  )
}
