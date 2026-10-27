import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useStudentActions } from '../hooks/useData.ts';

export default function FormPage() {
  const { addItem } = useStudentActions();
  const [name, setName] = useState('');
  const [homeroom, setHomeroom] = useState('');
  const [status, setStatus] = useState('Present');
  const [guardian, setGuardian] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !homeroom.trim() || !guardian.trim()) {
      return;
    }
    addItem({
      name,
      homeroom,
      status,
      guardian
    });
    setName('');
    setHomeroom('');
    setStatus('Present');
    setGuardian('');
  };

  return (
    <AppShell>
      <Navbar title="Add Student" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student name"
            />
          </div>
          <div>
            <label htmlFor="homeroom">Homeroom</label>
            <input
              id="homeroom"
              type="text"
              value={homeroom}
              onChange={(e) => setHomeroom(e.target.value)}
              placeholder="Homeroom"
            />
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>
          <div>
            <label htmlFor="guardian">Guardian</label>
            <input
              id="guardian"
              type="text"
              value={guardian}
              onChange={(e) => setGuardian(e.target.value)}
              placeholder="Guardian name"
            />
          </div>
          <button type="submit">Add Student</button>
        </form>
      </div>
    </AppShell>
  );
}
