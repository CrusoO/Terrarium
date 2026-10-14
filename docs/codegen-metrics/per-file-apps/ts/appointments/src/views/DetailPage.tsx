import React from 'react';
import { useSelectedVisit } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function DetailPage() {
  const visit = useSelectedVisit();

  return (
    <AppShell>
      <Navbar title="Appointment Details" />
      <div className="page">
        {visit ? (
          <div className="entity-card">
            <div>
              <h2>{visit.id}</h2>
              <p>
                <strong>Client:</strong> {visit.client}
              </p>
              <p>
                <strong>Service:</strong> {visit.service}
              </p>
              <p>
                <strong>When:</strong> {visit.when}
              </p>
              <p>
                <strong>Status:</strong> <StatusBadge status={visit.status} />
              </p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No appointment selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
