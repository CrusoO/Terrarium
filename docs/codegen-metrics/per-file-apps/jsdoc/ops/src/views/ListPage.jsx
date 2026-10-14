import React, { useState } from 'react';
import { useJobs } from '../hooks/useData.js';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import JobCard from '../components/JobCard';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';

const STATUSES = ['Open', 'Done', 'Overdue'];

/**
 * ListPage component for displaying and filtering jobs
 * @returns {React.ReactNode}
 */
export default function ListPage() {
  const jobs = useJobs();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('Open');

  const filtered = jobs.filter((job) => {
    const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase()) ||
                         job.owner.toLowerCase().includes(query.toLowerCase()) ||
                         job.id.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = activeStatus === 'All' || job.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

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
          {filtered.length === 0 ? (
            <p>No jobs found.</p>
          ) : (
            filtered.map((job) => (
              <JobCard key={job.id} item={job} onSelect={() => {}} />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
