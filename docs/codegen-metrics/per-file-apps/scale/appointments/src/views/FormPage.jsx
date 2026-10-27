import { useState } from 'react';
import { useVisitActions } from '../hooks/useData.js';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';

/**
 * FormPage component for creating new visits.
 * Provides a form with controlled inputs for all visit fields except id.
 * Calls addItem from useVisitActions to persist the new visit.
 * @returns {JSX.Element} The form page wrapped in AppShell
 */
export default function FormPage() {
  const { addItem } = useVisitActions();

  const [client, setClient] = useState('');
  const [service, setService] = useState('');
  const [status, setStatus] = useState('Booked');
  const [when, setWhen] = useState('');

  /**
   * Handles form submission.
   * Creates a new visit object and calls addItem.
   * Resets form fields after submission.
   * @param {Event} e - The form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    const newVisit = {
      client,
      service,
      status,
      when,
    };

    addItem(newVisit);

    setClient('');
    setService('');
    setStatus('Booked');
    setWhen('');
  };

  return (
    <AppShell>
      <Navbar title="New Appointment" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="client">Client:</label>
            <input
              id="client"
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="service">Service:</label>
            <input
              id="service"
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Booked">Booked</option>
              <option value="Done">Done</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="when">When:</label>
            <input
              id="when"
              type="text"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </div>

          <button type="submit">Create Appointment</button>
        </form>
      </div>
    </AppShell>
  );
}
