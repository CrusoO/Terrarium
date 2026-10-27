import StatusBadge from './StatusBadge.jsx'

/**
 * Leaf card that summarizes one order and reports selection by id.
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
    <div className="entity-card">
      <button type="button" onClick={() => onSelect(item.id)}>
        <div>{item.id}</div>
        <div>{item.customer}</div>
        <div>{item.city}</div>
        <div>{item.pickupDate}</div>
      </button>
      <StatusBadge status={item.paymentStatus} />
    </div>
  )
}
