import { useState } from 'react'
import { useProducts, useProductActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import ProductCard from '../components/ProductCard.jsx'

const CATEGORIES = ['Kitchen', 'Garden', 'Desk']

/**
 * ListPage component for displaying and filtering products.
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when a product is selected
 * @param {Function} [props.onDone] - Callback when action is complete
 * @returns {JSX.Element} The list page view
 */
export default function ListPage({ onOpen, onDone }) {
  const products = useProducts()
  const { select } = useProductActions()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Kitchen')

  const filtered = products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = product.category === activeCategory
    return matchesQuery && matchesCategory
  })

  const handleSelectProduct = (id) => {
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
          placeholder="Search products..."
        />
        <FilterTabs
          statuses={CATEGORIES}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      </div>
      <div className="entity-card">
        {filtered.length === 0 ? (
          <p>No products found.</p>
        ) : (
          filtered.map((product) => (
            <ProductCard
              key={product.id}
              item={product}
              onSelect={handleSelectProduct}
            />
          ))
        )}
      </div>
    </div>
  )
}
