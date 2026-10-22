import React from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useSelectedVisit } from '../hooks/useData.js';

/**
 * DetailPage component
 * Displays detailed information about a selected visit appointment.
 * @returns {React.ReactNode}
 */
export default function DetailPage() {
  const visit = useSelectedVisit();

  return (
    <AppShell>
      <Navbar title="Appointment Details" />
      <div className="page">
        {visit ? (
          <div className="entity-card">
            <div>
              <h2>{visit.client}</h2>
              <p><strong>ID:</strong> {visit.id}</p>
              <p><strong>Service:</strong> {visit.service}</p>
              <p><strong>When:</strong> {visit.when}</p>
              <p>
                <strong>Status:</strong> <StatusBadge status={visit.status} />
              </p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No visit selected.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
