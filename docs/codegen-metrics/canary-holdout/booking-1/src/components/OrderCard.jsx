export default function OrderCard({ item, onSelect }) {
  const statusClass =
    item.paymentStatus === 'Paid'
      ? 'status-paid'
      : item.paymentStatus === 'Unpaid'
        ? 'status-unpaid'
        : '';

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
      <span className={statusClass}>{item.paymentStatus}</span>
    </button>
  );
}
