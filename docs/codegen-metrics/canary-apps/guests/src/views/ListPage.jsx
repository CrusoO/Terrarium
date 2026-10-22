import { useState } from 'react'
import { useGuests, useGuestActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import GuestCard from '../components/GuestCard.jsx'

/**
 * ListPage component for displaying and filtering guests.
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when a guest is selected
 * @param {Function} [props.onDone] - Callback when action is complete
 * @returns {JSX.Element} The list page
 */
export default function ListPage({ onOpen, onDone }) {
  const guests = useGuests()
  const { select } = useGuestActions()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')

  const STATUSES = ['All', 'Yes', 'No', 'Maybe']

  const filtered = guests.filter((guest) => {
    const matchesQuery =
      guest.name.toLowerCase().includes(query.toLowerCase()) ||
      guest.party.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = activeStatus === 'All' || guest.status === activeStatus
    return matchesQuery && matchesStatus
  })

  const handleSelectGuest = (id) => {
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
          placeholder="Search by name or party..."
        />
        <FilterTabs
          statuses={STATUSES}
          active={activeStatus}
          onChange={setActiveStatus}
        />
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
  )
}
