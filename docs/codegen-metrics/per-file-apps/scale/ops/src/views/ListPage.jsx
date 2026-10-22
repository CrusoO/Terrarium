import React, { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import JobCard from '../components/JobCard.jsx';
import { useJobs } from '../hooks/useData.js';

/**
 * ListPage component for displaying and filtering jobs.
 * @returns {React.ReactNode}
 */
export default function ListPage() {
  const jobs = useJobs();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('Open');

  const STATUSES = ['Open', 'Done', 'Overdue'];

  const filtered = jobs.filter((job) => {
    const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase()) ||
                         job.owner.toLowerCase().includes(query.toLowerCase()) ||
                         job.id.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = job.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

  const handleSelectJob = (id) => {
    // Navigate to detail page or open detail view
    console.log('Selected job:', id);
  };

  return (
    <AppShell>
      <Navbar title="Operations" />
      <div className="page">
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by title, owner, or ID..."
          />
          <FilterTabs
            statuses={STATUSES}
            active={activeStatus}
            onChange={setActiveStatus}
          />
        </div>
        <div>
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              item={job}
              onSelect={handleSelectJob}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
