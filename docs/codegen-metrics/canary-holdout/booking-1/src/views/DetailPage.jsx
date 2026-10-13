import React from 'react';
import { useSelectedOrder } from '../hooks/useData.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage component displays the details of a selected order.
 * Renders a single order object with all its fields.
 * 
 * @component
 * @returns {React.ReactElement} The detail page view
 */
export default function DetailPage() {
  const order = useSelectedOrder();

  if (!order) {
    return (
      <div className="page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No order selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="entity-card">
        <div style={{ marginBottom: '1rem' }}>
          <h2>{order.id}</h2>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Customer:</strong> {order.customer}</p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>City:</strong> {order.city}</p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Payment Status:</strong></p>
          <StatusBadge status={order.paymentStatus} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Pickup Date:</strong> {order.pickupDate}</p>
        </div>
      </div>
    </div>
  );
}
