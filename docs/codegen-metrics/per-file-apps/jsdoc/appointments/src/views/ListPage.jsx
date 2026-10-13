import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import VisitCard from '../components/VisitCard';
import { useVisits } from '../hooks/useData.js';

/**
 * ListPage component for displaying and managing visits.
 * Provides search, filtering by status, and navigation to detail view.
 * @returns {React.ReactNode} The rendered list page
 */
export default function ListPage() {
  const visits = useVisits();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('Booked');

  const STATUSES = ['Booked', 'Done', 'Cancelled'];

  const filtered = visits.filter((item) => {
    const matchesQuery =
      item.client.toLowerCase().includes(query.toLowerCase()) ||
      item.service.toLowerCase().includes(query.toLowerCase()) ||
      item.id.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = item.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

  const handleSelectVisit = (id) => {
    // Navigate to detail page or open detail view
    // This would typically use a router or state management
    console.log('Selected visit:', id);
  };

  return (
    <AppShell>
      <Navbar title="Appointments" />
      <div className="page">
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by client, service, or ID..."
          />
          <FilterTabs
            statuses={STATUSES}
            active={activeStatus}
            onChange={setActiveStatus}
          />
        </div>
        <div>
          {filtered.length === 0 ? (
            <p>No visits found.</p>
          ) : (
            filtered.map((item) => (
              <VisitCard
                key={item.id}
                item={item}
                onSelect={handleSelectVisit}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
