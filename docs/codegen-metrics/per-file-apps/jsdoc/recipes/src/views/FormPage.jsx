import { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useRecipeActions } from '../hooks/useData.js';

/**
 * FormPage component for creating new recipes.
 * Provides a form with controlled inputs for recipe fields.
 * @returns {JSX.Element} The form page
 */
export default function FormPage() {
  const { addItem } = useRecipeActions();
  const [name, setName] = useState('');
  const [course, setCourse] = useState('Breakfast');
  const [minutes, setMinutes] = useState('');
  const [serves, setServes] = useState('');

  /**
   * Handles form submission
   * @param {Event} e - The form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const draft = {
      name,
      course,
      minutes: parseInt(minutes, 10) || 0,
      serves: parseInt(serves, 10) || 0,
    };
    addItem(draft);
    setName('');
    setCourse('Breakfast');
    setMinutes('');
    setServes('');
  };

  return (
    <AppShell>
      <Navbar title="Add Recipe" />
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Recipe name"
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
              placeholder="Cooking time in minutes"
              min="0"
            />
          </div>
          <div>
            <label htmlFor="serves">Serves</label>
            <input
              id="serves"
              type="number"
              value={serves}
              onChange={(e) => setServes(e.target.value)}
              placeholder="Number of servings"
              min="0"
            />
          </div>
          <button type="submit">Add Recipe</button>
        </form>
      </div>
    </AppShell>
  );
}
