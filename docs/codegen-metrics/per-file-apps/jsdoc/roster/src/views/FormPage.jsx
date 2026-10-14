import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useStudentActions } from '../hooks/useData.js';

/**
 * FormPage component for creating new students.
 * Provides a form with controlled inputs for all student fields except id.
 * @returns {React.ReactNode}
 */
export default function FormPage() {
  const { addItem } = useStudentActions();
  const [name, setName] = useState('');
  const [homeroom, setHomeroom] = useState('');
  const [status, setStatus] = useState('Present');
  const [guardian, setGuardian] = useState('');

  /**
   * Handles form submission by creating a new student.
   * @param {React.FormEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    addItem((draft) => {
      draft.push({
        id: `STU-${Date.now()}`,
        name,
        homeroom,
        status,
        guardian,
      });
    });
    setName('');
    setHomeroom('');
    setStatus('Present');
    setGuardian('');
  };

  return (
    <AppShell>
      <div className="page">
        <Navbar title="Add Student" />
        <div style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="homeroom" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Homeroom
              </label>
              <input
                id="homeroom"
                type="text"
                value={homeroom}
                onChange={(e) => setHomeroom(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="status" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="guardian" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Guardian
              </label>
              <input
                id="guardian"
                type="text"
                value={guardian}
                onChange={(e) => setGuardian(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Add Student
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
