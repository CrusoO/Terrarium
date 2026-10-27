import { useSelectedTailoringJob } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedTailoringJob()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>TailoringJob</p><h2>{item.garmentType || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>garmentType</strong> {String(item.garmentType ?? '')}</p>
        <p><strong>dueDate</strong> {String(item.dueDate ?? '')}</p>
        <p><strong>hemStatus</strong> {String(item.hemStatus ?? '')}</p>
        <p><strong>customerName</strong> {String(item.customerName ?? '')}</p>
        <p><strong>notes</strong> {String(item.notes ?? '')}</p>
    </article>
  )
}
