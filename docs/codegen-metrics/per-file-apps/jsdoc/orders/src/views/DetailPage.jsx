import React from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { useSelectedOrder } from '../hooks/useData.js';

/**
 * DetailPage component displays the details of a single selected order.
 * Renders order information including id, customer, city, paymentStatus, and pickupDate.
 * @returns {React.ReactNode} The detail page UI
 */
export default function DetailPage() {
  const selectedOrder = useSelectedOrder();

  return (
    <AppShell>
      <Navbar title="Order Details" />
      <div className="page">
        {selectedOrder ? (
          <div className="entity-card">
            <div>
              <h2>{selectedOrder.id}</h2>
              <p>
                <strong>Customer:</strong> {selectedOrder.customer}
              </p>
              <p>
                <strong>City:</strong> {selectedOrder.city}
              </p>
              <p>
                <strong>Payment Status:</strong>{' '}
                <StatusBadge status={selectedOrder.paymentStatus} />
              </p>
              <p>
                <strong>Pickup Date:</strong> {selectedOrder.pickupDate}
              </p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No order selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
