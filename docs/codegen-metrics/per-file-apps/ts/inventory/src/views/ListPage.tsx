import { useState } from 'react';
import { useSkus } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import SkuCard from '../components/SkuCard';

const STATUSES = ['Ok', 'Low', 'Out'];

export default function ListPage() {
  const skus = useSkus();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('');

  const filtered = skus.filter((sku) => {
    const matchesQuery =
      sku.name.toLowerCase().includes(query.toLowerCase()) ||
      sku.id.toLowerCase().includes(query.toLowerCase()) ||
      sku.aisle.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = activeStatus === '' || sku.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

  const handleSelectSku = (id: string) => {
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
        <div>
          {filtered.map((sku) => (
            <SkuCard key={sku.id} item={sku} onSelect={handleSelectSku} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
