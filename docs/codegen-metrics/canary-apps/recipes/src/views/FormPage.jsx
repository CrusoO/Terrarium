import { useState } from 'react'
import { useRecipeActions } from '../hooks/useData.js'

/**
 * FormPage component for creating new recipes.
 * Provides a form with controlled inputs for recipe fields.
 * @param {Object} props - Component props
 * @param {Function} [props.onDone] - Callback fired after recipe is added
 * @returns {JSX.Element}
 */
export default function FormPage({ onDone }) {
  const { addItem } = useRecipeActions()
  const [name, setName] = useState('')
  const [course, setCourse] = useState('Breakfast')
  const [minutes, setMinutes] = useState('')
  const [serves, setServes] = useState('')

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    addItem({
      name,
      course,
      minutes: parseInt(minutes, 10) || 0,
      serves: parseInt(serves, 10) || 0
    })
    setName('')
    setCourse('Breakfast')
    setMinutes('')
    setServes('')
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
          <label htmlFor="course">Course</label>
          <select
            id="course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>
        </div>
        <div>
          <label htmlFor="minutes">Minutes</label>
          <input
            id="minutes"
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="serves">Serves</label>
          <input
            id="serves"
            type="number"
            value={serves}
            onChange={(e) => setServes(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Recipe</button>
      </form>
    </div>
  )
}
