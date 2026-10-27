import React, { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import { useJobActions } from '../hooks/useData.js';

/**
 * FormPage component for creating new jobs.
 * Provides a form with controlled inputs for job fields.
 * @returns {React.ReactNode}
 */
export default function FormPage() {
  const { addItem } = useJobActions();
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('Open');
  const [dueDate, setDueDate] = useState('');

  /**
   * Handles form submission.
   * @param {React.FormEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const draft = {
      title,
      owner,
      status,
      dueDate,
    };
    addItem(draft);
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
              required
            />
          </div>
          <div>
            <label htmlFor="owner">Owner</label>
            <input
              id="owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              required
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
              required
            />
          </div>
          <button type="submit">Create Job</button>
        </form>
      </div>
    </AppShell>
  );
}
