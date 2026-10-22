import { useSelectedVolunteer } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedVolunteer()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Volunteer</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>role</strong> {String(item.role ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>shift</strong> {String(item.shift ?? '')}</p>
    </article>
  )
}
