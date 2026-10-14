import { useState } from 'react'
import { useTickets, useTicketActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import TicketCard from '../components/TicketCard.jsx'

/**
 * ListPage component for displaying and filtering tickets.
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when a ticket is selected
 * @param {Function} [props.onDone] - Callback when action completes
 * @returns {JSX.Element} The list page with search, filter, and ticket cards
 */
export default function ListPage({ onOpen, onDone }) {
  const tickets = useTickets()
  const { select } = useTicketActions()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('Open')

  const STATUSES = ['Open', 'Waiting', 'Closed']

  const filtered = tickets.filter((ticket) => {
    const matchesQuery =
      ticket.subject.toLowerCase().includes(query.toLowerCase()) ||
      ticket.requester.toLowerCase().includes(query.toLowerCase()) ||
      ticket.id.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = ticket.status === activeStatus
    return matchesQuery && matchesStatus
  })

  const handleSelect = (id) => {
    select(id)
    if (onOpen) {
      onOpen(id)
    }
  }

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
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  )
}
