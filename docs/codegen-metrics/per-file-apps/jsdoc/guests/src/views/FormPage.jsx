import { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useGuestActions } from '../hooks/useData.js';

/**
 * FormPage component for creating new guests.
 * Provides a form with controlled inputs for all guest fields except id.
 * @returns {JSX.Element} The form page
 */
export default function FormPage() {
  const { addItem } = useGuestActions();
  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [status, setStatus] = useState('Yes');
  const [seats, setSeats] = useState('');

  /**
   * Handles form submission
   * @param {Event} e - The form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !party.trim() || seats === '') {
      return;
    }
    addItem({
      name: name.trim(),
      party: party.trim(),
      status,
      seats: parseInt(seats, 10),
    });
    setName('');
    setParty('');
    setStatus('Yes');
    setSeats('');
  };

  return (
    <AppShell>
      <Navbar title="Add Guest" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guest name"
            />
          </div>
          <div>
            <label htmlFor="party">Party</label>
            <input
              id="party"
              type="text"
              value={party}
              onChange={(e) => setParty(e.target.value)}
              placeholder="Party name"
            />
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Maybe">Maybe</option>
            </select>
          </div>
          <div>
            <label htmlFor="seats">Seats</label>
            <input
              id="seats"
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              placeholder="Number of seats"
              min="1"
            />
          </div>
          <button type="submit">Add Guest</button>
        </form>
      </div>
    </AppShell>
  );
}
