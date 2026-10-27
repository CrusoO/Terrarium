import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../hooks/useData.js';

const CATEGORIES = ['Kitchen', 'Garden', 'Desk'];

/**
 * ListPage component displays a list of products with search and filter capabilities.
 * @returns {React.ReactElement} The rendered list page
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
    <AppShell>
      <Navbar title="Catalogue" />
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
    </AppShell>
  );
}
