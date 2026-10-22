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
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No order selected
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="entity-card">
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            Order ID
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            {order.id}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            Customer
          </div>
          <div style={{ fontSize: '1rem' }}>
            {order.customer}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            City
          </div>
          <div style={{ fontSize: '1rem' }}>
            {order.city}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            Payment Status
          </div>
          <div>
            <StatusBadge status={order.paymentStatus} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            Pickup Date
          </div>
          <div style={{ fontSize: '1rem' }}>
            {order.pickupDate}
          </div>
        </div>
      </div>
    </div>
  );
}
