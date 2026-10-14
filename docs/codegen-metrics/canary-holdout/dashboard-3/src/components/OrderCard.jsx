/**
 * Compact card for one order. Selecting it reports the order id.
 * @param {{ item: Order, onSelect: (id: string) => void }} props
 */
import StatusBadge from './StatusBadge.jsx'

export default function OrderCard({ item, onSelect }) {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      <strong>{item.id}</strong>
      <span>{item.customer}</span>
      <span>{item.city}</span>
      <span>{item.pickupDate}</span>
      <StatusBadge status={item.paymentStatus} />
    </button>
  )
}
