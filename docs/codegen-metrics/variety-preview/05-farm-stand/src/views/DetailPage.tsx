import { useSelectedProduce } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedProduce()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Produce</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>stall</strong> {String(item.stall ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>price</strong> {String(item.price ?? '')}</p>
    </article>
  )
}
