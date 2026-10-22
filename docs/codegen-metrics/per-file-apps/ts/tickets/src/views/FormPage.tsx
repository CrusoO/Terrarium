import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useTicketActions } from '../hooks/useData.ts';

export default function FormPage() {
  const { addItem } = useTicketActions();
  const [subject, setSubject] = useState('');
  const [requester, setRequester] = useState('');
  const [status, setStatus] = useState('Open');
  const [openedOn, setOpenedOn] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItem({
      subject,
      requester,
      status,
      openedOn,
    });
    setSubject('');
    setRequester('');
    setStatus('Open');
    setOpenedOn('');
  };

  return (
    <AppShell>
      <Navbar title="Create Ticket" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="requester">Requester</label>
            <input
              id="requester"
              type="text"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
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
              <option value="Waiting">Waiting</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label htmlFor="openedOn">Opened On</label>
            <input
              id="openedOn"
              type="date"
              value={openedOn}
              onChange={(e) => setOpenedOn(e.target.value)}
              required
            />
          </div>
          <button type="submit">Create Ticket</button>
        </form>
      </div>
    </AppShell>
  );
}
