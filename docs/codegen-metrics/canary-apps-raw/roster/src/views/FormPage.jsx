import { useState } from 'react'
import { useStudentActions } from '../hooks/useData.js'

/**
 * FormPage component for creating a new student.
 * @component
 * @returns {React.ReactNode} The form page with input fields for student data
 */
export default function FormPage() {
  const { addItem } = useStudentActions()
  const [name, setName] = useState('')
  const [homeroom, setHomeroom] = useState('')
  const [status, setStatus] = useState('Present')
  const [guardian, setGuardian] = useState('')

  /**
   * Handles form submission
   * @param {React.FormEvent} e - The form event
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    addItem((draft) => {
      draft.name = name
      draft.homeroom = homeroom
      draft.status = status
      draft.guardian = guardian
    })
    setName('')
    setHomeroom('')
    setStatus('Present')
    setGuardian('')
  }

  return (
    
      
      <div className="page">
        <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="homeroom" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Homeroom
            </label>
            <input
              id="homeroom"
              type="text"
              value={homeroom}
              onChange={(e) => setHomeroom(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
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
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="guardian" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Guardian
            </label>
            <input
              id="guardian"
              type="text"
              value={guardian}
              onChange={(e) => setGuardian(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
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
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Add Student
          </button>
        </form>
      </div>
    
  )
}
