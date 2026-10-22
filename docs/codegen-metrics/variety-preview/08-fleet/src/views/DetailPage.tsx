import { useSelectedVan } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedVan()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Van</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>route</strong> {String(item.route ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>miles</strong> {String(item.miles ?? '')}</p>
    </article>
  )
}
