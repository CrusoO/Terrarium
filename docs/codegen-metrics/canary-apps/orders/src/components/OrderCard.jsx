import StatusBadge from './StatusBadge.jsx'

/**
 * Clickable summary card for one order.
 *
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} customer
 * @property {string} city
 * @property {string} paymentStatus
 * @property {string} pickupDate
 */

/**
 * @param {Object} props
 * @param {Order} props.item
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
      <div className="entity-card-id">{item.id}</div>
      <div className="entity-card-customer">{item.customer}</div>
      <div className="entity-card-city">{item.city}</div>
      <div className="entity-card-pickup">{item.pickupDate}</div>
      <StatusBadge status={item.paymentStatus} />
    </button>
  )
}
