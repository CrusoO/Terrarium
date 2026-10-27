import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useOrderActions } from '../hooks/useData.ts';

export default function FormPage() {
  const { addItem } = useOrderActions();
  const [customer, setCustomer] = useState('');
  const [city, setCity] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [pickupDate, setPickupDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !city || !pickupDate) {
      alert('Please fill in all fields');
      return;
    }
    addItem({
      customer,
      city,
      paymentStatus,
      pickupDate,
    });
    setCustomer('');
    setCity('');
    setPaymentStatus('Paid');
    setPickupDate('');
  };

  return (
    <AppShell>
      <Navbar title="Create Order" />
      <div className="page">
        <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="customer" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Customer
            </label>
            <input
              id="customer"
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Enter customer name"
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="city" style={{ display: 'block', marginBottom: '0.5rem' }}>
              City
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city"
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="paymentStatus" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Payment Status
            </label>
            <select
              id="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            >
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="pickupDate" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Pickup Date
            </label>
            <input
              id="pickupDate"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Create Order
          </button>
        </form>
      </div>
    </AppShell>
  );
}
