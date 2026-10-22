import { useState } from 'react'
import { useOrderActions } from '../hooks/useData.js'

/**
 * FormPage component for creating new orders.
 * Provides a form with controlled inputs for all order fields except id.
 * @component
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback invoked after order is created
 * @returns {JSX.Element} The form page
 */
export default function FormPage({ onDone }) {
  const { addItem } = useOrderActions()

  const [buyer, setBuyer] = useState('')
  const [town, setTown] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('Unpaid')
  const [pickupDate, setPickupDate] = useState('')
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const [window, setWindow] = useState('')

  /**
   * Handles form submission.
   * Creates a new order object and adds it via the actions hook.
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    addItem({
      buyer,
      town,
      paymentStatus,
      pickupDate,
      note,
      phone,
      window
    })
    setBuyer('')
    setTown('')
    setPaymentStatus('Unpaid')
    setPickupDate('')
    setNote('')
    setPhone('')
    setWindow('')
    if (onDone) {
      onDone()
    }
  }

  return (
    
      
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="buyer">Buyer:</label>
            <input
              id="buyer"
              type="text"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="town">Town:</label>
            <input
              id="town"
              type="text"
              value={town}
              onChange={(e) => setTown(e.target.value)}
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
              <option value="Refunded">Refunded</option>
              <option value="Held">Held</option>
              <option value="Packed">Packed</option>
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

          <div>
            <label htmlFor="note">Note:</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="phone">Phone:</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="window">Window:</label>
            <input
              id="window"
              type="text"
              value={window}
              onChange={(e) => setWindow(e.target.value)}
            />
          </div>

          <button type="submit">Create Order</button>
        </form>
      </div>
    
  )
}
