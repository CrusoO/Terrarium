import React, { useState } from 'react';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useProducts } from '../hooks/useData.js';

const CATEGORIES = ['Kitchen', 'Garden', 'Desk'];

/**
 * ListPage component displays a list of products with search and filter capabilities.
 * @returns {React.ReactNode}
 */
export default function ListPage() {
  const products = useProducts();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Kitchen');

  const filtered = products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = product.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const handleSelectProduct = (id) => {
    console.log('Selected product:', id);
  };

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
      <div className="products-list">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            item={product}
            onSelect={handleSelectProduct}
          />
        ))}
      </div>
    </div>
  );
}
