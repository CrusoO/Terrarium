import { useSelectedLead } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedLead()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>mail</strong> {String(item.mail ?? '')}</p>
        <p><strong>plan</strong> {String(item.plan ?? '')}</p>
    </article>
  )
}
