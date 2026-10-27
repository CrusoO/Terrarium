import { useState } from 'react';
import { useOrderActions } from '../hooks/useData.js';

/**
 * FormPage component for creating new orders.
 * Provides a form with controlled inputs for order fields.
 * @component
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback invoked after form submission
 * @returns {JSX.Element} The form page
 */
export default function FormPage({ onDone }) {
  const { addItem } = useOrderActions();
  const [customer, setCustomer] = useState('');
  const [city, setCity] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [pickupDate, setPickupDate] = useState('');

  /**
   * Handles form submission.
   * Creates a new order and resets the form.
   * @param {Event} e - The form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    addItem({
      customer,
      city,
      paymentStatus,
      pickupDate,
    });
    setCustomer('');
    setCity('');
    setPaymentStatus('Unpaid');
    setPickupDate('');
    if (onDone) {
      onDone();
    }
  };

  return (
    
      
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="customer">Customer:</label>
            <input
              id="customer"
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="city">City:</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="paymentStatus">Payment Status:</label>
            <select
              id="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
          <div>
            <label htmlFor="pickupDate">Pickup Date:</label>
            <input
              id="pickupDate"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              required
            />
          </div>
          <button type="submit">Create Order</button>
        </form>
      </div>
    
  );
}
