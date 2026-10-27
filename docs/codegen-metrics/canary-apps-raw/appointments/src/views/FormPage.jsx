import { useState } from 'react'
import { useVisitActions } from '../hooks/useData.js'

/**
 * FormPage component for creating new visits.
 * Provides a form with controlled inputs for client, service, status, and when fields.
 * @component
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback fired after successful form submission
 * @returns {JSX.Element} The form page
 */
export default function FormPage({ onDone }) {
  const { addItem } = useVisitActions()
  const [client, setClient] = useState('')
  const [service, setService] = useState('')
  const [status, setStatus] = useState('Booked')
  const [when, setWhen] = useState('')

  /**
   * Handles form submission.
   * Creates a new visit object and adds it via the actions hook.
   * @param {Event} e - Form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    addItem({
      client,
      service,
      status,
      when
    })
    setClient('')
    setService('')
    setStatus('Booked')
    setWhen('')
    if (onDone) {
      onDone()
    }
  }

  return (
    
      
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="client">Client</label>
            <input
              id="client"
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="service">Service</label>
            <input
              id="service"
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
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
              <option value="Booked">Booked</option>
              <option value="Done">Done</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="when">When</label>
            <input
              id="when"
              type="text"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </div>
          <button type="submit">Create Visit</button>
        </form>
      </div>
    
  )
}
