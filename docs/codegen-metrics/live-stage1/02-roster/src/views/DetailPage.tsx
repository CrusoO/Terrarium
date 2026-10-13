import { useSelectedStudent } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedStudent()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>homeroom</strong> {String(item.homeroom ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>guardian</strong> {String(item.guardian ?? '')}</p>
    </article>
  )
}
