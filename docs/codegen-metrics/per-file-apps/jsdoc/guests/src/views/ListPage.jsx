import { useState } from 'react';
import { useGuests } from '../hooks/useData.js';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import GuestCard from '../components/GuestCard';
import Navbar from '../components/Navbar';
import AppShell from '../components/AppShell';

/**
 * ListPage component for displaying and managing guests.
 * Provides search, status filtering, and navigation to detail/form views.
 * @returns {JSX.Element} The rendered list page
 */
export default function ListPage() {
  const guests = useGuests();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');

  const STATUSES = ['All', 'Yes', 'No', 'Maybe'];

  const filtered = guests.filter((guest) => {
    const matchesQuery =
      guest.name.toLowerCase().includes(query.toLowerCase()) ||
      guest.party.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = activeStatus === 'All' || guest.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

  const handleSelectGuest = (id) => {
    window.location.hash = `#/detail/${id}`;
  };

  const handleCreateGuest = () => {
    window.location.hash = '#/form';
  };

  return (
    <AppShell>
      <Navbar title="Guests" />
      <div className="page">
        <div className="filter-row">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name or party..."
          />
          <FilterTabs
            statuses={STATUSES}
            active={activeStatus}
            onChange={setActiveStatus}
          />
          <button onClick={handleCreateGuest}>+ Add Guest</button>
        </div>
        <div className="guest-list">
          {filtered.map((guest) => (
            <GuestCard
              key={guest.id}
              item={guest}
              onSelect={handleSelectGuest}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
