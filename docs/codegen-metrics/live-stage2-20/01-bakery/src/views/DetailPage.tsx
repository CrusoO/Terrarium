import { useSelectedBatch } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedBatch()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Batch</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>baker</strong> {String(item.baker ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>due</strong> {String(item.due ?? '')}</p>
    </article>
  )
}
