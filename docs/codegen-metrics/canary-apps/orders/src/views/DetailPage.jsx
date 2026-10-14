import React from 'react';
import { useSelectedOrder } from '../hooks/useData.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage component displays the details of a selected order.
 * Renders a single order object with all its fields.
 * @component
 * @returns {React.ReactNode} The detail page UI
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
            <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedOrder.id}</h2>
            <p style={{ margin: '0.25rem 0', color: '#666' }}>
              Customer: {selectedOrder.customer}
            </p>
            <p style={{ margin: '0.25rem 0', color: '#666' }}>
              City: {selectedOrder.city}
            </p>
            <p style={{ margin: '0.25rem 0', color: '#666' }}>
              Pickup Date: {selectedOrder.pickupDate}
            </p>
            <div style={{ marginTop: '1rem' }}>
              <StatusBadge status={selectedOrder.paymentStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
