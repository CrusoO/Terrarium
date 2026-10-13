import { useState } from 'react';
import { useJobActions } from '../hooks/useData.js';

/**
 * FormPage component for creating new jobs.
 * Provides a form with controlled inputs for job fields.
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback fired after successful job creation
 * @returns {JSX.Element} Form page with job creation inputs
 */
export default function FormPage({ onDone }) {
  const { addItem } = useJobActions();
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('Open');
  const [dueDate, setDueDate] = useState('');

  /**
   * Handles form submission.
   * Creates a new job object and adds it via the actions hook.
   * @param {Event} e - Form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
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
    if (onDone) {
      onDone();
    }
  };

  return (
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
  );
}
