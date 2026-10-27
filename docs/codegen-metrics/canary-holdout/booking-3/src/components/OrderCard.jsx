import StatusBadge from './StatusBadge.jsx'

/**
 * Card for a single order. Selecting it reports the order id.
 * @param {{ item: { id: string, customer: string, city: string, paymentStatus: string, pickupDate: string }, onSelect: (id: string) => void }} props
 * @returns {JSX.Element}
 */
export default function OrderCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div className="entity-card-id">{item.id}</div>
      <div className="entity-card-customer">{item.customer}</div>
      <div className="entity-card-city">{item.city}</div>
      <div className="entity-card-pickup">{item.pickupDate}</div>
      <StatusBadge status={item.paymentStatus} />
    </button>
  )
}
