import React, { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import VisitCard from '../components/VisitCard.jsx';
import { useVisits } from '../hooks/useData.js';

/**
 * ListPage component for displaying and filtering visits.
 * @returns {React.ReactNode} The rendered list page.
 */
export default function ListPage() {
  const visits = useVisits();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('Booked');

  const STATUSES = ['Booked', 'Done', 'Cancelled'];

  const filtered = visits.filter((visit) => {
    const matchesQuery =
      visit.client.toLowerCase().includes(query.toLowerCase()) ||
      visit.service.toLowerCase().includes(query.toLowerCase()) ||
      visit.id.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = activeStatus === 'All' || visit.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

  const handleSelectVisit = (id) => {
    // Navigate to detail page or open detail modal
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
            filtered.map((visit) => (
              <VisitCard
                key={visit.id}
                item={visit}
                onSelect={handleSelectVisit}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
