import { useSelectedPoint } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedPoint()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.label || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>label</strong> {String(item.label ?? '')}</p>
        <p><strong>value</strong> {String(item.value ?? '')}</p>
        <p><strong>series</strong> {String(item.series ?? '')}</p>
    </article>
  )
}
