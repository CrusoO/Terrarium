import { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useJobActions } from '../hooks/useData.ts';

export default function FormPage() {
  const { addItem } = useJobActions();
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('Open');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !owner.trim() || !dueDate.trim()) {
      return;
    }
    addItem({
      title,
      owner,
      status,
      dueDate,
    });
    setTitle('');
    setOwner('');
    setStatus('Open');
    setDueDate('');
  };

  return (
    <AppShell>
      <Navbar title="Operations" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter job title"
            />
          </div>
          <div>
            <label htmlFor="owner">Owner</label>
            <input
              id="owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Enter owner name"
            />
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Open">Open</option>
              <option value="Done">Done</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label htmlFor="dueDate">Due Date</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <button type="submit">Create Job</button>
        </form>
      </div>
    </AppShell>
  );
}
