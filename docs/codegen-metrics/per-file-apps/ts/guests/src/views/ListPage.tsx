import { useState } from 'react';
import { useGuests } from '../hooks/useData.ts';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import GuestCard from '../components/GuestCard';
import Navbar from '../components/Navbar';
import AppShell from '../components/AppShell';

const STATUSES = ['Yes', 'No', 'Maybe'];

export default function ListPage() {
  const guests = useGuests();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('');

  const filtered = guests.filter((guest) => {
    const matchesQuery =
      guest.name.toLowerCase().includes(query.toLowerCase()) ||
      guest.party.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = !activeStatus || guest.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

  const handleSelectGuest = (id: string) => {
    window.location.href = `/detail/${id}`;
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
          <button onClick={() => (window.location.href = '/form')}>
            Add Guest
          </button>
        </div>
        <div className="entity-card">
          {filtered.length === 0 ? (
            <p>No guests found.</p>
          ) : (
            filtered.map((guest) => (
              <GuestCard
                key={guest.id}
                item={guest}
                onSelect={handleSelectGuest}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
