import React from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useSelectedStudent } from '../hooks/useData.js';

/**
 * DetailPage component
 * Displays detailed information about a selected student
 * @returns {React.ReactNode}
 */
export default function DetailPage() {
  const selectedStudent = useSelectedStudent();

  return (
    <AppShell>
      <Navbar title="Student Detail" />
      <div className="page">
        {selectedStudent ? (
          <div className="entity-card">
            <div>
              <h2>{selectedStudent.name}</h2>
              <p><strong>ID:</strong> {selectedStudent.id}</p>
              <p><strong>Homeroom:</strong> {selectedStudent.homeroom}</p>
              <p><strong>Status:</strong> {selectedStudent.status}</p>
              <p><strong>Guardian:</strong> {selectedStudent.guardian}</p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No student selected</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
