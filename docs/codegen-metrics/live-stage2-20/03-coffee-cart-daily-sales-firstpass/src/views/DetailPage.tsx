import { useSelectedSale } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedSale()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Sale</p><h2>{item.drinkType || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>drinkType</strong> {String(item.drinkType ?? '')}</p>
        <p><strong>quantity</strong> {String(item.quantity ?? '')}</p>
        <p><strong>hour</strong> {String(item.hour ?? '')}</p>
        <p><strong>price</strong> {String(item.price ?? '')}</p>
        <p><strong>timestamp</strong> {String(item.timestamp ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
    </article>
  )
}
