import StatusBadge from './StatusBadge.jsx'

export default function OrderCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div>
        <strong>{item.id}</strong>
      </div>
      <div>{item.customer}</div>
      <div>{item.city}</div>
      <div>{item.pickupDate}</div>
      <StatusBadge status={item.paymentStatus} />
    </button>
  )
}
