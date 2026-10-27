import { useSelectedTool } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedTool()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Tool</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>hook</strong> {String(item.hook ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>borrower</strong> {String(item.borrower ?? '')}</p>
    </article>
  )
}
