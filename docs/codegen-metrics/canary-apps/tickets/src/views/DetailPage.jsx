import React from 'react';
import { useSelectedTicket } from '../hooks/useData.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage component displays the details of a selected ticket.
 * @returns {React.ReactNode} The rendered detail page
 */
export default function DetailPage() {
  const selectedTicket = useSelectedTicket();

  if (!selectedTicket) {
    return (
      
        
        <div className="page">
          <p>No ticket selected</p>
        </div>
      
    );
  }

  return (
    
      
      <div className="page">
        <div className="entity-card">
          <div style={{ marginBottom: '1rem' }}>
            <h2>{selectedTicket.subject}</h2>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>ID:</strong> {selectedTicket.id}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Requester:</strong> {selectedTicket.requester}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Status:</strong> <StatusBadge status={selectedTicket.status} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Opened On:</strong> {selectedTicket.openedOn}
          </div>
        </div>
      </div>
    
  );
}
