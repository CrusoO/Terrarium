import { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import StatusBadge from '../components/StatusBadge';
import { useSelectedRecipe } from '../hooks/useData.js';

const COURSES = ['Breakfast', 'Dinner', 'Snack'];

/**
 * DetailPage component
 * Displays a single recipe with search and filter capabilities
 * @returns {JSX.Element}
 */
export default function DetailPage() {
  const [query, setQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState('');
  const selectedRecipe = useSelectedRecipe();

  if (!selectedRecipe) {
    return (
      <AppShell>
        <Navbar title="Recipe Details" />
        <div className="page">
          <div className="filter-row">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search recipes..."
            />
            <FilterTabs
              statuses={COURSES}
              active={activeCourse}
              onChange={setActiveCourse}
            />
          </div>
          <p>No recipe selected</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Navbar title="Recipe Details" />
      <div className="page">
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search recipes..."
          />
          <FilterTabs
            statuses={COURSES}
            active={activeCourse}
            onChange={setActiveCourse}
          />
        </div>
        <div className="entity-card">
          <div>
            <h2>{selectedRecipe.name}</h2>
            <StatusBadge status={selectedRecipe.course} />
          </div>
          <div>
            <p><strong>ID:</strong> {selectedRecipe.id}</p>
            <p><strong>Course:</strong> {selectedRecipe.course}</p>
            <p><strong>Minutes:</strong> {selectedRecipe.minutes}</p>
            <p><strong>Serves:</strong> {selectedRecipe.serves}</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
