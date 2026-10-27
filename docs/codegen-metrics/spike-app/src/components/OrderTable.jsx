import StatusBadge from './StatusBadge.jsx';

export default function OrderTable({ orders, onSelect }) {
  return (
    <table className="order-table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>City</th>
          <th>Pickup date</th>
          <th>Payment status</th>
        </tr>
      </thead>
      <tbody>
        {orders.length === 0 ? (
          <tr>
            <td colSpan={4}>
              <div className="empty-state">No orders yet.</div>
            </td>
          </tr>
        ) : (
          orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => onSelect && onSelect(order.id)}
              style={{ cursor: 'pointer' }}
            >
              <td>{order.customer}</td>
              <td>{order.city}</td>
              <td>{order.pickupDate}</td>
              <td>
                <StatusBadge status={order.paymentStatus} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
