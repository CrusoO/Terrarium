import StatusBadge from './StatusBadge.jsx'

/**
 * Displays one order as a selectable card.
 * @param {{ item: { id: string, customer: string, city: string, paymentStatus: string, pickupDate: string }, onSelect: (id: string) => void }} props
 */
export default function OrderCard({ item, onSelect }) {
  return (
    <article className="entity-card">
      <button type="button" onClick={() => onSelect(item.id)}>
        <strong>{item.id}</strong>
        <span>{item.customer}</span>
        <span>{item.city}</span>
        <span>Pickup: {item.pickupDate}</span>
        <StatusBadge status={item.paymentStatus} />
      </button>
    </article>
  )
}
