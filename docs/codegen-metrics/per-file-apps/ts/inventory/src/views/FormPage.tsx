import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useSkuActions } from '../hooks/useData.ts';

export default function FormPage() {
  const { addItem } = useSkuActions();
  const [name, setName] = useState('');
  const [aisle, setAisle] = useState('');
  const [status, setStatus] = useState('Ok');
  const [onHand, setOnHand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !aisle.trim() || onHand === '') {
      return;
    }
    addItem({
      name: name.trim(),
      aisle: aisle.trim(),
      status,
      onHand: parseInt(onHand, 10),
    });
    setName('');
    setAisle('');
    setStatus('Ok');
    setOnHand('');
  };

  return (
    <AppShell>
      <Navbar title="Add SKU" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter SKU name"
            />
          </div>
          <div>
            <label htmlFor="aisle">Aisle</label>
            <input
              id="aisle"
              type="text"
              value={aisle}
              onChange={(e) => setAisle(e.target.value)}
              placeholder="Enter aisle location"
            />
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Ok">Ok</option>
              <option value="Low">Low</option>
              <option value="Out">Out</option>
            </select>
          </div>
          <div>
            <label htmlFor="onHand">On Hand</label>
            <input
              id="onHand"
              type="number"
              value={onHand}
              onChange={(e) => setOnHand(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>
          <button type="submit">Add Item</button>
        </form>
      </div>
    </AppShell>
  );
}
