import { useState } from 'react';
import { useJobs } from '../hooks/useData.ts';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import JobCard from '../components/JobCard';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';

const STATUSES = ['Open', 'Done', 'Overdue'];

export default function ListPage() {
  const jobs = useJobs();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('Open');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = jobs.filter((job) => {
    const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase()) ||
                         job.owner.toLowerCase().includes(query.toLowerCase());
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
            placeholder="Search jobs..."
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
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
