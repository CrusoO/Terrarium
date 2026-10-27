import { useSelectedVisit } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedVisit()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.client || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>client</strong> {String(item.client ?? '')}</p>
        <p><strong>service</strong> {String(item.service ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>when</strong> {String(item.when ?? '')}</p>
    </article>
  )
}
