import React from 'react';
import { useSelectedStudent } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function DetailPage() {
  const student = useSelectedStudent();

  return (
    <AppShell>
      <Navbar title="Student Detail" />
      <div className="page">
        {student ? (
          <div className="entity-card">
            <div>
              <h2>{student.name}</h2>
              <p><strong>ID:</strong> {student.id}</p>
              <p><strong>Homeroom:</strong> {student.homeroom}</p>
              <p><strong>Guardian:</strong> {student.guardian}</p>
              <p><strong>Status:</strong> <StatusBadge status={student.status} /></p>
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
