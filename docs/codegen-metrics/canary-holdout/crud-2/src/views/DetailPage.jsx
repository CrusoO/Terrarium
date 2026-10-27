import React from 'react';
import { useSelectedStudent, useStudentActions } from '../hooks/useData.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * DetailPage
 * @returns {React.ReactNode}
 */
export default function DetailPage() {
  const student = useSelectedStudent();
  const { select } = useStudentActions();

  if (!student) {
    return (
      
        
        <div className="page">
          <p>No student selected</p>
        </div>
      
    );
  }

  return (
    
      
      <div className="page">
        <div className="entity-card">
          <div style={{ marginBottom: '1rem' }}>
            <h2>{student.name}</h2>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>ID:</strong> {student.id}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Homeroom:</strong> {student.homeroom}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Status:</strong> <StatusBadge status={student.status} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Guardian:</strong> {student.guardian}
          </div>
        </div>
      </div>
    
  );
}
