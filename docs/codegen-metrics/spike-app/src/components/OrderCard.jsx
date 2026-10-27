import StatusBadge from './StatusBadge.jsx';

export default function OrderCard({ order, onSelect }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="order-card" onClick={() => onSelect && onSelect(order.id)}>
      <div className="order-card-header">
        <span className="order-id">{order.id}</span>
        <StatusBadge status={order.paymentStatus} />
      </div>
      <div className="order-card-body">
        <p className="order-customer"><strong>Customer:</strong> {order.customer}</p>
        <p className="order-city"><strong>City:</strong> {order.city}</p>
        <p className="order-items"><strong>Items:</strong> {itemCount} unit{itemCount !== 1 ? 's' : ''}</p>
        <p className="order-date"><strong>Pickup:</strong> {order.pickupDate}</p>
      </div>
    </div>
  );
}
