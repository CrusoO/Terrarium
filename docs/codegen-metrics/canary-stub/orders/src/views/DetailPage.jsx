import { useSelectedOrder } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedOrder(null)
  if (!item) return <p>Select an item.</p>
  return <article className="entity-card"><h2>{item.customer || item.id}</h2></article>
}
