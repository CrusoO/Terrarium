import React from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { useSelectedJob } from '../hooks/useData.js';

/**
 * DetailPage component
 * Displays the detail view of a selected job
 * @returns {React.ReactNode}
 */
export default function DetailPage() {
  const selectedJob = useSelectedJob();

  return (
    <AppShell>
      <Navbar title="Job Details" />
      <div className="page">
        {selectedJob ? (
          <div className="entity-card">
            <div>
              <h2>{selectedJob.title}</h2>
              <p><strong>ID:</strong> {selectedJob.id}</p>
              <p><strong>Owner:</strong> {selectedJob.owner}</p>
              <p><strong>Status:</strong> <StatusBadge status={selectedJob.status} /></p>
              <p><strong>Due Date:</strong> {selectedJob.dueDate}</p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No job selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
