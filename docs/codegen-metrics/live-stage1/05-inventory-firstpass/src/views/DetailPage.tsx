import { useSelectedSku } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedSku()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>aisle</strong> {String(item.aisle ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>onHand</strong> {String(item.onHand ?? '')}</p>
    </article>
  )
}
