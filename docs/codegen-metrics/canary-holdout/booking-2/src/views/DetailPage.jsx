import React from 'react';
import { useSelectedVisit, useVisitActions } from '../hooks/useData.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage component displays the details of a selected visit.
 * @component
 * @returns {React.ReactNode} The detail page UI
 */
export default function DetailPage() {
  const visit = useSelectedVisit();
  const { select } = useVisitActions();

  if (!visit) {
    return (
      
        
        <div className="page">
          <p>No visit selected</p>
        </div>
      
    );
  }

  return (
    
      
      <div className="page">
        <div className="entity-card">
          <div style={{ marginBottom: '1rem' }}>
            <h2>{visit.client}</h2>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>ID:</strong> {visit.id}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Service:</strong> {visit.service}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>When:</strong> {visit.when}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong> <StatusBadge status={visit.status} />
          </div>
          <button onClick={() => select(null)} style={{ marginTop: '1rem' }}>
            Back to List
          </button>
        </div>
      </div>
    
  );
}
