import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useVisitActions } from '../hooks/useData.ts';

export default function FormPage() {
  const { addItem } = useVisitActions();
  const [client, setClient] = useState('');
  const [service, setService] = useState('');
  const [status, setStatus] = useState('Booked');
  const [when, setWhen] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !service || !when) {
      alert('Please fill in all fields');
      return;
    }
    addItem({
      client,
      service,
      status,
      when,
    });
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
              placeholder="Client name"
            />
          </div>
          <div>
            <label htmlFor="service">Service:</label>
            <input
              id="service"
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Service type"
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
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <button type="submit">Create Appointment</button>
        </form>
      </div>
    </AppShell>
  );
}
