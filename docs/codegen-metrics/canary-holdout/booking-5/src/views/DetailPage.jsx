import React from 'react';
import { useSelectedOrder } from '../hooks/useData.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage component
 * Displays the details of a single selected order.
 * @component
 * @returns {React.ReactNode} The detail page view
 */
export default function DetailPage() {
  const order = useSelectedOrder();

  if (!order) {
    return (
      <div className="page">
        <p>No order selected</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="entity-card">
        <div>
          <p><strong>ID:</strong> {order.id}</p>
          <p><strong>Customer:</strong> {order.customer}</p>
          <p><strong>City:</strong> {order.city}</p>
          <p><strong>Payment Status:</strong> <StatusBadge status={order.paymentStatus} /></p>
          <p><strong>Pickup Date:</strong> {order.pickupDate}</p>
        </div>
      </div>
    </div>
  );
}
