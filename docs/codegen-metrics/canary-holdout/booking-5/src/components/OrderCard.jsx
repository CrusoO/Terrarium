import StatusBadge from './StatusBadge.jsx'

/**
 * Summary card for one order. Selecting it reports the order id.
 * @param {object} props
 * @param {{ id: string, customer: string, city: string, paymentStatus: string, pickupDate: string }} props.item
 * @param {(id: string) => void} props.onSelect
 */
export default function OrderCard({ item, onSelect }) {
  return (
    <article className="entity-card">
      <button type="button" onClick={() => onSelect(item.id)}>
        <div>{item.id}</div>
        <div>{item.customer}</div>
        <div>{item.city}</div>
        <div>{item.pickupDate}</div>
        <StatusBadge status={item.paymentStatus} />
      </button>
    </article>
  )
}
