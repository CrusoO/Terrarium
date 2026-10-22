import { useState } from 'react'
import { useJobs, useJobActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import JobCard from '../components/JobCard.jsx'

/**
 * ListPage component for displaying and filtering jobs
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when a job is selected
 * @param {Function} [props.onDone] - Callback when action completes
 * @returns {JSX.Element} The list page view
 */
export default function ListPage({ onOpen, onDone }) {
  const jobs = useJobs()
  const { select } = useJobActions()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')

  const STATUSES = ['All', 'Open', 'Done', 'Overdue']

  const filtered = jobs.filter((job) => {
    const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase()) ||
                         job.owner.toLowerCase().includes(query.toLowerCase()) ||
                         job.id.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = activeStatus === 'All' || job.status === activeStatus
    return matchesQuery && matchesStatus
  })

  const handleSelectJob = (id) => {
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
          placeholder="Search by title, owner, or ID..."
        />
        <FilterTabs
          statuses={STATUSES}
          active={activeStatus}
          onChange={setActiveStatus}
        />
      </div>
      <div className="jobs-list">
        {filtered.map((job) => (
          <JobCard
            key={job.id}
            item={job}
            onSelect={handleSelectJob}
          />
        ))}
      </div>
    </div>
  )
}
