import { useState } from 'react'
import { useVisitActions } from '../hooks/useData.js'

/**
 * FormPage component for creating new visits.
 * Provides a form with controlled inputs for client, service, status, and when fields.
 * @component
 * @returns {React.ReactNode} The form page wrapped in AppShell
 */
export default function FormPage() {
  const { addItem } = useVisitActions()
  const [client, setClient] = useState('')
  const [service, setService] = useState('')
  const [status, setStatus] = useState('Booked')
  const [when, setWhen] = useState('')

  /**
   * Handles form submission.
   * Creates a new visit object and adds it to the collection.
   * @param {React.FormEvent} e - The form submission event
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
  }

  return (
    
      
      <div className="page">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px', margin: '2rem auto' }}>
          <div>
            <label htmlFor="client" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Client
            </label>
            <input
              id="client"
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Client name"
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="service" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Service
            </label>
            <input
              id="service"
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Service type"
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="status" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              <option value="Booked">Booked</option>
              <option value="Done">Done</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="when" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              When
            </label>
            <input
              id="when"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
          >
            Create Appointment
          </button>
        </form>
      </div>
    
  )
}
