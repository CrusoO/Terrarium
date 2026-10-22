import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import StudentCard from '../components/StudentCard';
import { useStudents } from '../hooks/useData.js';

/**
 * ListPage component for displaying and managing students.
 * Provides search, filtering by status, and navigation to detail/form views.
 * @returns {React.ReactNode}
 */
export default function ListPage() {
  const students = useStudents();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');

  const STATUSES = ['All', 'Present', 'Absent', 'Late'];

  const filtered = students.filter((student) => {
    const matchesQuery =
      student.name.toLowerCase().includes(query.toLowerCase()) ||
      student.id.toLowerCase().includes(query.toLowerCase()) ||
      student.homeroom.toLowerCase().includes(query.toLowerCase()) ||
      student.guardian.toLowerCase().includes(query.toLowerCase());

    const matchesStatus =
      activeStatus === 'All' || student.status === activeStatus;

    return matchesQuery && matchesStatus;
  });

  const handleSelectStudent = (id) => {
    window.location.hash = `#/detail/${id}`;
  };

  return (
    <AppShell>
      <Navbar title="Roster" />
      <div className="page">
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name, ID, homeroom, or guardian..."
          />
          <FilterTabs
            statuses={STATUSES}
            active={activeStatus}
            onChange={setActiveStatus}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => {
              window.location.hash = '#/form';
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Add Student
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {filtered.map((student) => (
            <StudentCard
              key={student.id}
              item={student}
              onSelect={handleSelectStudent}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No students found.
          </div>
        )}
      </div>
    </AppShell>
  );
}
