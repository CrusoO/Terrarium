import React from 'react';
import { useSelectedSku } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function DetailPage() {
  const selectedSku = useSelectedSku();

  return (
    <AppShell>
      <Navbar title="Inventory" />
      <div className="page">
        {selectedSku ? (
          <div className="entity-card">
            <div>
              <h2>{selectedSku.name}</h2>
              <p><strong>ID:</strong> {selectedSku.id}</p>
              <p><strong>Aisle:</strong> {selectedSku.aisle}</p>
              <p><strong>On Hand:</strong> {selectedSku.onHand}</p>
              <p><strong>Status:</strong> <StatusBadge status={selectedSku.status} /></p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No SKU selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
