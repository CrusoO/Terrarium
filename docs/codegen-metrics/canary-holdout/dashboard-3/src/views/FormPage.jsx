import React, { useState } from 'react';
import { useOrderActions } from '../hooks/useData.js';

/**
 * FormPage component for creating a new Order.
 * Provides a form with controlled inputs for each Order field except id.
 * On submit, calls addItem with the form data and then onDone callback.
 *
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback invoked after form submission
 * @returns {React.ReactNode} The form page UI
 */
export default function FormPage({ onDone }) {
  const { addItem } = useOrderActions();

  const [formData, setFormData] = useState({
    customer: '',
    city: '',
    paymentStatus: 'Unpaid',
    pickupDate: '',
  });

  /**
   * Handles input change for form fields.
   * @param {string} field - The field name
   * @param {string} value - The new value
   */
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Handles form submission.
   * Calls addItem with the form data and invokes onDone callback.
   * @param {React.FormEvent} e - The form event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    addItem(formData);
    setFormData({
      customer: '',
      city: '',
      paymentStatus: 'Unpaid',
      pickupDate: '',
    });
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
              value={formData.customer}
              onChange={(e) => handleChange('customer', e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="city">City:</label>
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="paymentStatus">Payment Status:</label>
            <select
              id="paymentStatus"
              value={formData.paymentStatus}
              onChange={(e) => handleChange('paymentStatus', e.target.value)}
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
              value={formData.pickupDate}
              onChange={(e) => handleChange('pickupDate', e.target.value)}
              required
            />
          </div>

          <button type="submit">Create Order</button>
        </form>
      </div>
    
  );
}
