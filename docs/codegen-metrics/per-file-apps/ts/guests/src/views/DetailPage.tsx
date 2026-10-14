import React from 'react';
import { useSelectedGuest } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function DetailPage() {
  const guest = useSelectedGuest();

  return (
    <AppShell>
      <Navbar title="Guest Details" />
      <div className="page">
        {guest ? (
          <div className="entity-card">
            <div>
              <h2>{guest.name}</h2>
              <p><strong>ID:</strong> {guest.id}</p>
              <p><strong>Party:</strong> {guest.party}</p>
              <p><strong>Seats:</strong> {guest.seats}</p>
              <p><strong>Status:</strong> <StatusBadge status={guest.status} /></p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No guest selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
