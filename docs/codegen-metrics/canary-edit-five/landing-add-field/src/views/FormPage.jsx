import { useState } from 'react'
import { useLeadActions } from '../hooks/useData.js'

/**
 * FormPage
 * @param {Object} props
 * @param {(id: string) => void} [props.onOpen]
 * @param {() => void} [props.onDone]
 * @returns {JSX.Element}
 */
export default function FormPage({ onOpen, onDone }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('Studio')
  const [phone, setPhone] = useState('')

  const { addItem } = useLeadActions()

  const handleSubmit = (e) => {
    e.preventDefault()
    addItem({ name, email, plan, phone })
    setName('')
    setEmail('')
    setPlan('Studio')
    setPhone('')
    if (onDone) onDone()
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
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="plan">Plan</label>
          <select
            id="plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="Studio">Studio</option>
            <option value="Workshop">Workshop</option>
            <option value="Private">Private</option>
          </select>
        </div>
        <div>
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <button type="submit">Create Lead</button>
      </form>
    </div>
  )
}
