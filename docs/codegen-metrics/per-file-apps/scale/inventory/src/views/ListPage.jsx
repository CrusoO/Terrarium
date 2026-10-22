import React, { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import SkuCard from '../components/SkuCard.jsx';
import { useSkus } from '../hooks/useData.js';

/**
 * ListPage component for displaying and filtering SKU inventory.
 * @returns {React.ReactNode} The rendered list page with search, filter, and SKU cards.
 */
export default function ListPage() {
  const skus = useSkus();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');

  const STATUSES = ['All', 'Ok', 'Low', 'Out'];

  const filtered = skus.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.id.toLowerCase().includes(query.toLowerCase()) ||
      item.aisle.toLowerCase().includes(query.toLowerCase());

    const matchesStatus = activeStatus === 'All' || item.status === activeStatus;

    return matchesQuery && matchesStatus;
  });

  const handleSelectSku = (id) => {
    console.log('Selected SKU:', id);
  };

  return (
    <AppShell>
      <div className="page">
        <Navbar title="Inventory" />
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name, ID, or aisle..."
          />
          <FilterTabs
            statuses={STATUSES}
            active={activeStatus}
            onChange={setActiveStatus}
          />
        </div>
        <div className="entity-card">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <SkuCard
                key={item.id}
                item={item}
                onSelect={handleSelectSku}
              />
            ))
          ) : (
            <p>No SKUs found.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
