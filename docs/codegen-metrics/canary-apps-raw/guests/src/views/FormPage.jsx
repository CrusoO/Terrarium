import { useState } from 'react'
import { useGuestActions } from '../hooks/useData.js'

/**
 * FormPage component for creating a new guest.
 * Renders a form with controlled inputs for guest fields.
 * On submit, calls addItem with the form data and then onDone callback.
 *
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback fired after form submission
 * @returns {JSX.Element} Form page element
 */
export default function FormPage({ onDone }) {
  const { addItem } = useGuestActions()
  const [name, setName] = useState('')
  const [party, setParty] = useState('')
  const [status, setStatus] = useState('Yes')
  const [seats, setSeats] = useState('')

  /**
   * Handles form submission.
   * Creates a new guest object and calls addItem, then onDone.
   *
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    addItem({
      name,
      party,
      status,
      seats: parseInt(seats, 10) || 0,
    })
    setName('')
    setParty('')
    setStatus('Yes')
    setSeats('')
    if (onDone) {
      onDone()
    }
  }

  return (
    <div className="page">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="party">Party</label>
          <input
            id="party"
            type="text"
            value={party}
            onChange={(e) => setParty(e.target.value)}
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
            min="0"
          />
        </div>
        <button type="submit">Add Guest</button>
      </form>
    </div>
  )
}
