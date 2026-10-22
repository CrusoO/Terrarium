import React from 'react';
import { useSelectedOrder } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function DetailPage() {
  const order = useSelectedOrder();

  return (
    <AppShell>
      <Navbar title="Order Details" />
      <div className="page">
        {order ? (
          <div className="entity-card">
            <div>
              <h2>{order.id}</h2>
              <p>
                <strong>Customer:</strong> {order.customer}
              </p>
              <p>
                <strong>City:</strong> {order.city}
              </p>
              <p>
                <strong>Pickup Date:</strong> {order.pickupDate}
              </p>
              <p>
                <strong>Payment Status:</strong>{' '}
                <StatusBadge status={order.paymentStatus} />
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
