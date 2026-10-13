/**
 * @file src/views/FormPage.jsx
 * @description Form page for adding new SKU items to inventory
 */

import { useState } from 'react'
import { useSkuActions } from '../hooks/useData.js'

/**
 * FormPage component
 * Provides a form to create new SKU items
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when item is opened
 * @param {Function} [props.onDone] - Callback when form submission is complete
 * @returns {React.ReactNode}
 */
export default function FormPage({ onOpen, onDone }) {
  const { addItem } = useSkuActions()

  const [name, setName] = useState('')
  const [aisle, setAisle] = useState('')
  const [status, setStatus] = useState('Ok')
  const [onHand, setOnHand] = useState('')

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault()

    const draft = {
      name,
      aisle,
      status,
      onHand: parseInt(onHand, 10) || 0,
    }

    addItem(draft)

    setName('')
    setAisle('')
    setStatus('Ok')
    setOnHand('')

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
            <label htmlFor="aisle">Aisle</label>
            <input
              id="aisle"
              type="text"
              value={aisle}
              onChange={(e) => setAisle(e.target.value)}
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
              <option value="Ok">Ok</option>
              <option value="Low">Low</option>
              <option value="Out">Out</option>
            </select>
          </div>

          <div>
            <label htmlFor="onHand">On Hand</label>
            <input
              id="onHand"
              type="number"
              value={onHand}
              onChange={(e) => setOnHand(e.target.value)}
              required
            />
          </div>

          <button type="submit">Add Item</button>
        </form>
      </div>
    
  )
}
