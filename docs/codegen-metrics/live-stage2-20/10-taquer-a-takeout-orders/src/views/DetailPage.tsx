import { useSelectedOrder } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedOrder()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Order</p><h2>{item.customerName || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>customerName</strong> {String(item.customerName ?? '')}</p>
        <p><strong>tacoItems</strong> {String(item.tacoItems ?? '')}</p>
        <p><strong>paymentStatus</strong> {String(item.paymentStatus ?? '')}</p>
        <p><strong>orderTime</strong> {String(item.orderTime ?? '')}</p>
        <p><strong>totalAmount</strong> {String(item.totalAmount ?? '')}</p>
    </article>
  )
}
