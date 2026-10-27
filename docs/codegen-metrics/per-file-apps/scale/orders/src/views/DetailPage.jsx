import React from 'react';
import { useSelectedOrder } from '../hooks/useData.js';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage component
 * Displays the details of a single selected order
 * @returns {React.ReactNode}
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
                <strong>Pickup Date:</strong> {selectedOrder.pickupDate}
              </p>
              <p>
                <strong>Payment Status:</strong>{' '}
                <StatusBadge status={selectedOrder.paymentStatus} />
              </p>
            </div>
          </div>
        ) : (
          <div className="entity-card">
            <p>No order selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
