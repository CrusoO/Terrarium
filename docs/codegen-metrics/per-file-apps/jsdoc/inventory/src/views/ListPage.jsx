import React, { useState } from 'react';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import SkuCard from '../components/SkuCard.jsx';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
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

  const filtered = skus.filter((sku) => {
    const matchesQuery = sku.name.toLowerCase().includes(query.toLowerCase()) ||
                         sku.id.toLowerCase().includes(query.toLowerCase()) ||
                         sku.aisle.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = activeStatus === 'All' || sku.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

  const handleSelectSku = (id) => {
    // Navigate to detail page or open detail view
    console.log('Selected SKU:', id);
  };

  return (
    <AppShell>
      <Navbar title="Inventory" />
      <div className="page">
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
        <div className="sku-list">
          {filtered.map((sku) => (
            <SkuCard
              key={sku.id}
              item={sku}
              onSelect={handleSelectSku}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
