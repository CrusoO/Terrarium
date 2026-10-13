import { useState } from 'react'
import { useRecipes, useRecipeActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import RecipeCard from '../components/RecipeCard.jsx'

/**
 * ListPage component for displaying and filtering recipes.
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when a recipe is selected
 * @returns {JSX.Element} The list page
 */
export default function ListPage({ onOpen }) {
  const recipes = useRecipes()
  const { select } = useRecipeActions()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const COURSES = ['All', 'Breakfast', 'Dinner', 'Snack']

  const filtered = recipes.filter((recipe) => {
    const matchesQuery = recipe.name.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = activeFilter === 'All' || recipe.course === activeFilter
    return matchesQuery && matchesFilter
  })

  const handleSelect = (id) => {
    select(id)
    if (onOpen) {
      onOpen(id)
    }
  }

  return (
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
      </div>
      <div className="entity-card">
        {filtered.length === 0 ? (
          <p>No recipes found.</p>
        ) : (
          filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              item={recipe}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
