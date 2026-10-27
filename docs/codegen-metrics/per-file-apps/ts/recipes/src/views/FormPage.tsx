import { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import { useRecipeActions } from '../hooks/useData.ts';

export default function FormPage() {
  const { addItem } = useRecipeActions();
  const [name, setName] = useState('');
  const [course, setCourse] = useState('Breakfast');
  const [minutes, setMinutes] = useState('');
  const [serves, setServes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && minutes && serves) {
      addItem({
        name: name.trim(),
        course,
        minutes: parseInt(minutes, 10),
        serves: parseInt(serves, 10),
      });
      setName('');
      setCourse('Breakfast');
      setMinutes('');
      setServes('');
    }
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
            />
          </div>
          <div>
            <label htmlFor="course">Course</label>
            <select
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              <option>Breakfast</option>
              <option>Dinner</option>
              <option>Snack</option>
            </select>
          </div>
          <div>
            <label htmlFor="minutes">Minutes</label>
            <input
              id="minutes"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="Cooking time"
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
            />
          </div>
          <button type="submit">Add Recipe</button>
        </form>
      </div>
    </AppShell>
  );
}
