import React from 'react';
import { useSelectedJob, useJobActions } from '../hooks/useData.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage component
 * Displays the detail view of a selected job
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when opening a job
 * @param {Function} [props.onDone] - Callback when done
 * @returns {React.ReactNode}
 */
export default function DetailPage(props) {
  const selectedJob = useSelectedJob();

  if (!selectedJob) {
    return (
      
        
        <div className="page">
          <p>No job selected</p>
        </div>
      
    );
  }

  return (
    
      
      <div className="page">
        <div className="entity-card">
          <div>
            <h2>{selectedJob.title}</h2>
            <p><strong>ID:</strong> {selectedJob.id}</p>
            <p><strong>Owner:</strong> {selectedJob.owner}</p>
            <p><strong>Status:</strong> <StatusBadge status={selectedJob.status} /></p>
            <p><strong>Due Date:</strong> {selectedJob.dueDate}</p>
          </div>
        </div>
      </div>
    
  );
}
