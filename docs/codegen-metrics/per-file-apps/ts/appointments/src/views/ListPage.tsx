import React, { useState } from 'react';
import { useVisits } from '../hooks/useData.ts';
import { useSelectedVisit } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import VisitCard from '../components/VisitCard';

const STATUSES = ['Booked', 'Done', 'Cancelled'];

export default function ListPage() {
  const visits = useVisits();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = visits.filter((visit) => {
    const matchesQuery =
      query === '' ||
      visit.client.toLowerCase().includes(query.toLowerCase()) ||
      visit.service.toLowerCase().includes(query.toLowerCase()) ||
      visit.id.toLowerCase().includes(query.toLowerCase());

    const matchesStatus = activeStatus === '' || visit.status === activeStatus;

    return matchesQuery && matchesStatus;
  });

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
          {filtered.map((visit) => (
            <VisitCard
              key={visit.id}
              item={visit}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
