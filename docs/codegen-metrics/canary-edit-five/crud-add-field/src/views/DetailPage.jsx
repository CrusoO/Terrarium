import React from 'react';
import { useSelectedOrder } from '../hooks/useData.js';

/**
 * DetailPage component displays the details of a selected order.
 * @component
 * @returns {React.ReactNode} The detail page UI
 */
export default function DetailPage() {
  const selectedOrder = useSelectedOrder();

  if (!selectedOrder) {
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
            <strong>ID:</strong> {selectedOrder.id}
          </div>
          <div>
            <strong>Customer:</strong> {selectedOrder.customer}
          </div>
          <div>
            <strong>City:</strong> {selectedOrder.city}
          </div>
          <div>
            <strong>Payment Status:</strong> {selectedOrder.paymentStatus}
          </div>
          <div>
            <strong>Pickup Date:</strong> {selectedOrder.pickupDate}
          </div>
          <div>
            <strong>Note:</strong> {selectedOrder.note}
          </div>
        </div>
      </div>
    
  );
}
