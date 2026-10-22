import React from 'react';
import { useSelectedOrder } from '../hooks/useData.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage component displays the details of a selected order.
 * Renders a single order object retrieved from the useSelectedOrder hook.
 * 
 * @component
 * @returns {React.ReactElement} The detail page view showing order information
 */
export default function DetailPage() {
  const selectedOrder = useSelectedOrder();

  if (!selectedOrder) {
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
      <div style={{ padding: '2rem' }}>
        <div className="entity-card">
          <div style={{ marginBottom: '1rem' }}>
            <strong>Order ID:</strong> {selectedOrder.id}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Customer:</strong> {selectedOrder.customer}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>City:</strong> {selectedOrder.city}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Payment Status:</strong>{' '}
            <StatusBadge status={selectedOrder.paymentStatus} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Pickup Date:</strong> {selectedOrder.pickupDate}
          </div>
        </div>
      </div>
    </div>
  );
}
