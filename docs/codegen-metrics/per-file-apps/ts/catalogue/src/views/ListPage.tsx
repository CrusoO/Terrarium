import { useState } from 'react';
import { useProducts } from '../hooks/useData.ts';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import ProductCard from '../components/ProductCard';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';

const CATEGORIES = ['Kitchen', 'Garden', 'Desk'];

export default function ListPage() {
  const products = useProducts();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const filtered = products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !activeCategory || product.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const handleSelectProduct = (id: string) => {
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
        <div className="entity-card">
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
