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
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No order selected
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="entity-card">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
            {selectedOrder.id}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              Status:
            </span>
            <StatusBadge status={selectedOrder.paymentStatus} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Customer
            </label>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
              {selectedOrder.customer}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              City
            </label>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
              {selectedOrder.city}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Payment Status
            </label>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
              {selectedOrder.paymentStatus}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Pickup Date
            </label>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
              {selectedOrder.pickupDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
