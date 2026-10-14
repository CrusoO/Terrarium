import { useSelectedPoint } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedPoint(null)
  if (!item) return <p>Select an item.</p>
  return <article className="entity-card"><h2>{item.label || item.id}</h2></article>
}
