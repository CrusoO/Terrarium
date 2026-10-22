import { useState } from 'react';
import { useStudents } from '../hooks/useData.ts';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import StudentCard from '../components/StudentCard';
import Navbar from '../components/Navbar';
import AppShell from '../components/AppShell';

const STATUSES = ['Present', 'Absent', 'Late'];

export default function ListPage() {
  const students = useStudents();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('');

  const filtered = students.filter((student) => {
    const matchesQuery =
      student.name.toLowerCase().includes(query.toLowerCase()) ||
      student.homeroom.toLowerCase().includes(query.toLowerCase()) ||
      student.guardian.toLowerCase().includes(query.toLowerCase());

    const matchesStatus = activeStatus === '' || student.status === activeStatus;

    return matchesQuery && matchesStatus;
  });

  const handleSelectStudent = (id: string) => {
    window.location.hash = `#/detail/${id}`;
  };

  const handleCreateStudent = () => {
    window.location.hash = '#/form';
  };

  return (
    <AppShell>
      <Navbar title="Roster" />
      <div className="page">
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name, homeroom, or guardian..."
          />
          <FilterTabs
            statuses={STATUSES}
            active={activeStatus}
            onChange={setActiveStatus}
          />
          <button onClick={handleCreateStudent}>Add Student</button>
        </div>
        <div>
          {filtered.map((student) => (
            <StudentCard
              key={student.id}
              item={student}
              onSelect={handleSelectStudent}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
