import { useState } from 'react'
import { useVisits, useVisitActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import VisitCard from '../components/VisitCard.jsx'

/**
 * ListPage component for displaying and managing visits.
 * Provides search, status filtering, and visit selection capabilities.
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when a visit is selected
 * @param {Function} [props.onDone] - Callback when action completes
 * @returns {JSX.Element} The list page view
 */
export default function ListPage({ onOpen, onDone }) {
  const visits = useVisits()
  const { select } = useVisitActions()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')

  const STATUSES = ['All', 'Booked', 'Done', 'Cancelled']

  const filtered = visits.filter((visit) => {
    const matchesQuery =
      query === '' ||
      visit.client.toLowerCase().includes(query.toLowerCase()) ||
      visit.service.toLowerCase().includes(query.toLowerCase()) ||
      visit.id.toLowerCase().includes(query.toLowerCase())

    const matchesStatus = activeStatus === 'All' || visit.status === activeStatus

    return matchesQuery && matchesStatus
  })

  const handleSelectVisit = (id) => {
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
        {filtered.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No visits found
          </p>
        ) : (
          filtered.map((visit) => (
            <VisitCard
              key={visit.id}
              item={visit}
              onSelect={handleSelectVisit}
            />
          ))
        )}
      </div>
    </div>
  )
}
