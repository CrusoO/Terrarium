import React, { useState } from 'react';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import TicketCard from '../components/TicketCard.jsx';
import { useTickets } from '../hooks/useData.js';

/**
 * ListPage component for displaying and managing tickets.
 * Provides search, status filtering, and navigation to detail view.
 * @returns {React.ReactNode}
 */
export default function ListPage() {
  const tickets = useTickets();
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('Open');

  const STATUSES = ['Open', 'Waiting', 'Closed'];

  const filtered = tickets.filter((ticket) => {
    const matchesQuery =
      ticket.subject.toLowerCase().includes(query.toLowerCase()) ||
      ticket.requester.toLowerCase().includes(query.toLowerCase()) ||
      ticket.id.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = ticket.status === activeStatus;
    return matchesQuery && matchesStatus;
  });

  const handleSelectTicket = (id) => {
    window.location.hash = `#/detail/${id}`;
  };

  return (
    <div className="page">
      <div className="filter-row">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search tickets..."
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
