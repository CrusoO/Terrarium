import { useSelectedJob } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedJob()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.title || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>title</strong> {String(item.title ?? '')}</p>
        <p><strong>owner</strong> {String(item.owner ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>dueDate</strong> {String(item.dueDate ?? '')}</p>
        <p><strong>note</strong> {String(item.note ?? '')}</p>
    </article>
  )
}
