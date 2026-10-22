import { useState } from 'react';
import { useRecipes } from '../hooks/useData.js';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import RecipeCard from '../components/RecipeCard';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';

/**
 * ListPage component for displaying and filtering recipes.
 * @returns {JSX.Element} The rendered list page
 */
export default function ListPage() {
  const recipes = useRecipes();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const COURSES = ['All', 'Breakfast', 'Dinner', 'Snack'];

  /**
   * Filter recipes based on search query and active course filter
   * @type {Array}
   */
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesQuery = recipe.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = activeFilter === 'All' || recipe.course === activeFilter;
    return matchesQuery && matchesFilter;
  });

  /**
   * Handle recipe selection
   * @param {string} id - The recipe id
   */
  const handleSelectRecipe = (id) => {
    window.location.hash = `#/detail/${id}`;
  };

  /**
   * Handle create new recipe
   */
  const handleCreate = () => {
    window.location.hash = '#/form';
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
          <button onClick={handleCreate}>+ New Recipe</button>
        </div>
        <div className="recipe-list">
          {filteredRecipes.map((recipe) => (
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
