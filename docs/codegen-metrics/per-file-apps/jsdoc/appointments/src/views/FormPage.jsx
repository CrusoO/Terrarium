import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useVisitActions } from '../hooks/useData.js';

/**
 * FormPage component for creating new visits.
 * Provides a form with controlled inputs for all visit fields except id.
 * @returns {React.ReactNode}
 */
export default function FormPage() {
  const { addItem } = useVisitActions();
  const [client, setClient] = useState('');
  const [service, setService] = useState('');
  const [status, setStatus] = useState('Booked');
  const [when, setWhen] = useState('');

  /**
   * Handles form submission by creating a new visit.
   * @param {React.FormEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const draft = {
      client,
      service,
      status,
      when,
    };
    addItem(draft);
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
