import StatusBadge from './StatusBadge.jsx'

/**
 * Clickable card summarizing one order.
 * @param {{ item: { id: string, customer: string, city: string, paymentStatus: string, pickupDate: string }, onSelect: (id: string) => void }} props
 */
export default function OrderCard({ item, onSelect }) {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      <span>{item.id}</span>
      <span>{item.customer}</span>
      <span>{item.city}</span>
      <span>Pickup: {item.pickupDate}</span>
      <StatusBadge status={item.paymentStatus} />
    </button>
  )
}
