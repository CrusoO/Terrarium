import StatusBadge from './StatusBadge.jsx'

/**
 * Summary card for one order. Selecting the card reports its id.
 * @param {{ item: Order, onSelect: (id: string) => void }} props
 */
export default function OrderCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div className="entity-card-title">{item.customer}</div>
      <div className="entity-card-meta">{item.city}</div>
      <div className="entity-card-meta">Pickup: {item.pickupDate}</div>
      <StatusBadge status={item.paymentStatus} />
    </button>
  )
}
