import { useSelectedJob } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedJob(null)
  if (!item) return <p>Select an item.</p>
  return <article className="entity-card"><h2>{item.title || item.id}</h2></article>
}
