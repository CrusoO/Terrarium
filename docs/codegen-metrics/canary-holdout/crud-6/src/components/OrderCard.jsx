/**
 * OrderCard: leaf component that renders one order as a selectable card.
 *
 * @param {object} props
 * @param {Order} props.item - The order to display.
 * @param {(id: string) => void} props.onSelect - Called with item.id when the card is clicked.
 * @returns {JSX.Element}
 */
export default function OrderCard({ item, onSelect }) {
  const status = item.paymentStatus
  const statusClass =
    status === 'Paid' ? 'status-paid' :
    status === 'Unpaid' ? 'status-unpaid' :
    ''

  return (
    <article className="entity-card">
      <button
        type="button"
        onClick={() => onSelect(item.id)}
      >
        <strong>{item.id}</strong>
        <div>{item.customer}</div>
        <div>{item.city}</div>
        <div>Pickup: {item.pickupDate}</div>
        <span className={statusClass}>{status}</span>
      </button>
    </article>
  )
}
