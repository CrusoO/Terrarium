import StatusBadge from './StatusBadge.jsx'

/**
 * Card summarizing one order. Selecting it reports the order id upward.
 *
 * @param {Object} props
 * @param {Order} props.item - The order to display.
 * @param {(id: string) => void} props.onSelect - Called with item.id when the card is clicked.
 * @returns {JSX.Element}
 */
export default function OrderCard({ item, onSelect }) {
  return (
    <article className="entity-card">
      <button type="button" onClick={() => onSelect(item.id)}>
        <span>{item.id}</span>{' '}
        <span>{item.customer}</span>{' '}
        <span>{item.city}</span>{' '}
        <span>{item.pickupDate}</span>{' '}
        <StatusBadge status={item.paymentStatus} />
      </button>
    </article>
  )
}
