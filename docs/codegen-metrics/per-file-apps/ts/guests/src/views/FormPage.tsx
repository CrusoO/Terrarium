import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useGuestActions } from '../hooks/useData.ts';
import type { Guest } from '../types';

export default function FormPage() {
  const { addItem } = useGuestActions();
  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [status, setStatus] = useState('Yes');
  const [seats, setSeats] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !party.trim()) {
      return;
    }
    addItem({
      name: name.trim(),
      party: party.trim(),
      status,
      seats: parseInt(seats, 10),
    } as Omit<Guest, 'id'>);
    setName('');
    setParty('');
    setStatus('Yes');
    setSeats('1');
  };

  return (
    <AppShell>
      <Navbar title="Add Guest" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label>
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Guest name"
              />
            </label>
          </div>
          <div>
            <label>
              Party:
              <input
                type="text"
                value={party}
                onChange={(e) => setParty(e.target.value)}
                placeholder="Party name"
              />
            </label>
          </div>
          <div>
            <label>
              Status:
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Maybe">Maybe</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              Seats:
              <input
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                min="1"
              />
            </label>
          </div>
          <button type="submit">Add Guest</button>
        </form>
      </div>
    </AppShell>
  );
}
