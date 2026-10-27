import StatusBadge from './StatusBadge.jsx'

/**
 * Card summarizing one order. Clicking it reports the order id.
 *
 * @param {object} props
 * @param {{id: string, customer: string, city: string, paymentStatus: string, pickupDate: string}} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
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
      <div>Pickup: {item.pickupDate}</div>
      <StatusBadge status={item.paymentStatus} />
    </button>
  )
}
