import { useSelectedSupply } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedSupply()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Supply</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>cabinet</strong> {String(item.cabinet ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>count</strong> {String(item.count ?? '')}</p>
    </article>
  )
}
