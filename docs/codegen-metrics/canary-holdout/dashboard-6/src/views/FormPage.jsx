import { useState } from 'react'
import { useVisitActions } from '../hooks/useData.js'

/**
 * FormPage component for creating new visits.
 * Provides a form with controlled inputs for client, service, status, and when fields.
 * Calls addItem action on submit and invokes onDone callback.
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback invoked after form submission
 * @returns {React.ReactNode}
 */
export default function FormPage({ onDone }) {
  const { addItem } = useVisitActions()
  const [client, setClient] = useState('')
  const [service, setService] = useState('')
  const [status, setStatus] = useState('Booked')
  const [when, setWhen] = useState('')

  /**
   * Handles form submission.
   * Creates a new visit object and adds it via the action hook.
   * @param {React.FormEvent} e - Form event
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
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="client" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Client
            </label>
            <input
              id="client"
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Enter client name"
              required
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="service" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Service
            </label>
            <input
              id="service"
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Enter service type"
              required
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="status" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            >
              <option value="Booked">Booked</option>
              <option value="Done">Done</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="when" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              When
            </label>
            <input
              id="when"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Create Visit
          </button>
        </form>
      </div>
    
  )
}
