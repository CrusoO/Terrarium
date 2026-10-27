import { useState } from 'react';
import { useRecipes } from '../hooks/useData.ts';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import RecipeCard from '../components/RecipeCard';
import Navbar from '../components/Navbar';
import AppShell from '../components/AppShell';

const COURSES = ['Breakfast', 'Dinner', 'Snack'];

export default function ListPage() {
  const recipes = useRecipes();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const filtered = recipes.filter((recipe) => {
    const matchesQuery = recipe.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = !activeFilter || recipe.course === activeFilter;
    return matchesQuery && matchesFilter;
  });

  const handleSelectRecipe = (id: string) => {
    window.location.hash = `/detail/${id}`;
  };

  const handleCreateRecipe = () => {
    window.location.hash = '/form';
  };

  return (
    <AppShell>
      <Navbar title="Recipes" />
      <div className="page">
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search recipes..."
          />
          <FilterTabs
            statuses={COURSES}
            active={activeFilter}
            onChange={setActiveFilter}
          />
          <button onClick={handleCreateRecipe}>Create Recipe</button>
        </div>
        <div className="entity-card">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              item={recipe}
              onSelect={handleSelectRecipe}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
