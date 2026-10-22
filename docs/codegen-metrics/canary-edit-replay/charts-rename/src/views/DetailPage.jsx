import { useSelectedPoint } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedPoint()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.month || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>month</strong> {String(item.month ?? '')}</p>
        <p><strong>value</strong> {String(item.value ?? '')}</p>
        <p><strong>series</strong> {String(item.series ?? '')}</p>
    </article>
  )
}
