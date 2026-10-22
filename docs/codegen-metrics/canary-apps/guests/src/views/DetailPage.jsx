import React from 'react';
import { useSelectedGuest, useGuestActions } from '../hooks/useData.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage
 * @param {Object} props
 * @param {(id: string) => void} [props.onOpen]
 * @param {() => void} [props.onDone]
 * @returns {React.ReactNode}
 */
export default function DetailPage({ onOpen, onDone }) {
  const guest = useSelectedGuest();
  const { select } = useGuestActions();

  if (!guest) {
    return (
      
        
        <div className="page">
          <p>No guest selected</p>
        </div>
      
    );
  }

  return (
    
      
      <div className="page">
        <div className="entity-card">
          <div style={{ marginBottom: '1rem' }}>
            <h2>{guest.name}</h2>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>ID:</strong> {guest.id}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Party:</strong> {guest.party}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Status:</strong> <StatusBadge status={guest.status} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Seats:</strong> {guest.seats}
          </div>
        </div>
      </div>
    
  );
}
