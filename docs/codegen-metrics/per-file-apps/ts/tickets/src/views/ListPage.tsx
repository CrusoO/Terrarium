import { useState } from 'react';
import { useTickets } from '../hooks/useData.ts';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import TicketCard from '../components/TicketCard';

const STATUSES = ['Open', 'Waiting', 'Closed'];

export default function ListPage() {
  const tickets = useTickets();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('Open');

  const filtered = tickets.filter((ticket) => {
    const matchesQuery =
      ticket.subject.toLowerCase().includes(query.toLowerCase()) ||
      ticket.requester.toLowerCase().includes(query.toLowerCase()) ||
      ticket.id.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = ticket.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

  const handleSelectTicket = (id: string) => {
    console.log('Selected ticket:', id);
  };

  return (
    <div className="page">
      <div className="filter-row">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by subject, requester, or ID..."
        />
        <FilterTabs
          statuses={STATUSES}
          active={activeStatus}
          onChange={setActiveStatus}
        />
      </div>
      <div>
        {filtered.map((ticket) => (
          <TicketCard
            key={ticket.id}
            item={ticket}
            onSelect={handleSelectTicket}
          />
        ))}
      </div>
    </div>
  );
}
