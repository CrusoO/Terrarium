import { useSelectedVisit } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedVisit(null)
  if (!item) return <p>Select an item.</p>
  return <article className="entity-card"><h2>{item.client || item.id}</h2></article>
}
