import React from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useSelectedGuest } from '../hooks/useData.js';

/**
 * DetailPage component
 * Displays detailed information about a selected guest
 * @returns {React.ReactNode}
 */
export default function DetailPage() {
  const selectedGuest = useSelectedGuest();

  return (
    <AppShell>
      <Navbar title="Guest Details" />
      <div className="page">
        {selectedGuest ? (
          <div className="entity-card">
            <div>
              <h2>{selectedGuest.name}</h2>
              <p><strong>ID:</strong> {selectedGuest.id}</p>
              <p><strong>Party:</strong> {selectedGuest.party}</p>
              <p><strong>Status:</strong> {selectedGuest.status}</p>
              <p><strong>Seats:</strong> {selectedGuest.seats}</p>
            </div>
          </div>
        ) : (
          <div className="entity-card">
            <p>No guest selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
