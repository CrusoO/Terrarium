import React from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
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
              <strong>ID:</strong> {selectedJob.id}
            </div>
            <div>
              <strong>Title:</strong> {selectedJob.title}
            </div>
            <div>
              <strong>Owner:</strong> {selectedJob.owner}
            </div>
            <div>
              <strong>Status:</strong> {selectedJob.status}
            </div>
            <div>
              <strong>Due Date:</strong> {selectedJob.dueDate}
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
