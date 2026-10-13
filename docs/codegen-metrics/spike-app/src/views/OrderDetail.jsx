import { useOrders } from '../context/OrderContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function OrderDetail() {
  const { orders, selectedId } = useOrders();
  const order = orders.find((o) => o.id === selectedId);

  if (!order) {
    return (
      <div className="page">
        <div className="empty-state">Select an order to view details.</div>
      </div>
    );
  }

  const orderTotal = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <div className="page">
      <h2>{order.id}</h2>
      <p><strong>Customer:</strong> {order.customer}</p>
      <p><strong>City:</strong> {order.city}</p>
      <p><strong>Pickup date:</strong> {order.pickupDate}</p>
      <p>
        <strong>Payment status:</strong>{' '}
        <StatusBadge status={order.paymentStatus} />
      </p>

      <h3>Items</h3>
      <table className="order-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Line total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="item-row">
              <td>{item.name}</td>
              <td>{item.qty}</td>
              <td>${item.price.toFixed(2)}</td>
              <td className="line-total">${(item.qty * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}><strong>Order total</strong></td>
            <td className="line-total"><strong>${orderTotal.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
