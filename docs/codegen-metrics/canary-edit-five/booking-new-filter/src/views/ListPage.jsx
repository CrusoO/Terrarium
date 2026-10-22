import { useState } from 'react'
import { useVisits, useVisitActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import VisitCard from '../components/VisitCard.jsx'

const STATUSES = ['Booked', 'Done', 'Cancelled', 'Waiting']

/**
 * ListPage component for displaying and managing visits.
 * Provides search, status filtering, and visit selection.
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when a visit is selected
 * @param {Function} [props.onDone] - Callback when action completes
 * @returns {JSX.Element} The list page with search, filters, and visit cards
 */
export default function ListPage({ onOpen, onDone }) {
  const visits = useVisits()
  const { select } = useVisitActions()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('Booked')

  const filtered = visits.filter((item) => {
    const matchesQuery =
      String(item.client ?? '').toLowerCase().includes(query.toLowerCase()) ||
      String(item.service ?? '').toLowerCase().includes(query.toLowerCase()) ||
      String(item.id ?? '').toLowerCase().includes(query.toLowerCase())

    const matchesStatus =
      activeStatus === 'All' || String(item.status ?? '') === activeStatus

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
          placeholder="Search by client, service, or ID..."
        />
        <FilterTabs
          statuses={STATUSES}
          active={activeStatus}
          onChange={setActiveStatus}
        />
      </div>
      <div className="visits-list">
        {filtered.map((item) => (
          <VisitCard key={item.id} item={item} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  )
}
