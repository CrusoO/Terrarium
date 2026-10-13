import { useState } from 'react'
import { useStudentActions } from '../hooks/useData.js'

/**
 * FormPage component for creating a new student.
 * @component
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback fired after form submission
 * @returns {JSX.Element} The form page
 */
export default function FormPage({ onDone }) {
  const { addItem } = useStudentActions()
  const [name, setName] = useState('')
  const [homeroom, setHomeroom] = useState('')
  const [status, setStatus] = useState('Present')
  const [guardian, setGuardian] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    addItem((draft) => {
      draft.push({
        id: `STU-${Date.now()}`,
        name,
        homeroom,
        status,
        guardian
      })
    })
    setName('')
    setHomeroom('')
    setStatus('Present')
    setGuardian('')
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
            <label htmlFor="homeroom">Homeroom</label>
            <input
              id="homeroom"
              type="text"
              value={homeroom}
              onChange={(e) => setHomeroom(e.target.value)}
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
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>
          <div>
            <label htmlFor="guardian">Guardian</label>
            <input
              id="guardian"
              type="text"
              value={guardian}
              onChange={(e) => setGuardian(e.target.value)}
              required
            />
          </div>
          <button type="submit">Add Student</button>
        </form>
      </div>
    
  )
}
