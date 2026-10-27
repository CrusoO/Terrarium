import { useSelectedOrder } from '../hooks/useData.js'
export default function DetailPage() {
  const item = useSelectedOrder()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><h2>{item.customer || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>customer</strong> {String(item.customer ?? '')}</p>
        <p><strong>city</strong> {String(item.city ?? '')}</p>
        <p><strong>paymentStatus</strong> {String(item.paymentStatus ?? '')}</p>
        <p><strong>pickupDate</strong> {String(item.pickupDate ?? '')}</p>
        <p><strong>phone</strong> {String(item.phone ?? '')}</p>
    </article>
  )
}
