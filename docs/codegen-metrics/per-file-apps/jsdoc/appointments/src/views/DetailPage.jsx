import React from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { useSelectedVisit } from '../hooks/useData.js';

/**
 * DetailPage component displays the details of a selected visit appointment.
 * @returns {React.ReactNode} The rendered detail page with visit information.
 */
export default function DetailPage() {
  const selectedVisit = useSelectedVisit();

  return (
    <AppShell>
      <Navbar title="Appointment Details" />
      <div className="page">
        {selectedVisit ? (
          <div className="entity-card">
            <div>
              <h2>{selectedVisit.client}</h2>
              <p><strong>ID:</strong> {selectedVisit.id}</p>
              <p><strong>Service:</strong> {selectedVisit.service}</p>
              <p><strong>When:</strong> {selectedVisit.when}</p>
              <p>
                <strong>Status:</strong>{' '}
                <StatusBadge status={selectedVisit.status} />
              </p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No appointment selected.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
