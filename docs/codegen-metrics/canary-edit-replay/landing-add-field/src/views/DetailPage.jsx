import { useSelectedLead } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedLead()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>email</strong> {String(item.email ?? '')}</p>
        <p><strong>plan</strong> {String(item.plan ?? '')}</p>
        <p><strong>note</strong> {String(item.note ?? '')}</p>
    </article>
  )
}
