import { useSelectedItem } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedItem()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>note</strong> {String(item.note ?? '')}</p>
    </article>
  )
}
