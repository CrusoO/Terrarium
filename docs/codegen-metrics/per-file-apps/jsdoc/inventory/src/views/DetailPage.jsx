import React from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useSelectedSku } from '../hooks/useData.js';

/**
 * DetailPage component
 * Displays detailed information about a selected SKU item
 * @returns {React.ReactNode}
 */
export default function DetailPage() {
  const selectedSku = useSelectedSku();

  return (
    <AppShell>
      <Navbar title="SKU Detail" />
      <div className="page">
        {selectedSku ? (
          <div className="entity-card">
            <h2>{selectedSku.name}</h2>
            <div>
              <p><strong>ID:</strong> {selectedSku.id}</p>
              <p><strong>Aisle:</strong> {selectedSku.aisle}</p>
              <p><strong>Status:</strong> {selectedSku.status}</p>
              <p><strong>On Hand:</strong> {selectedSku.onHand}</p>
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
