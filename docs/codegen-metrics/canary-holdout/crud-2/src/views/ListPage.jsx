import { useState } from 'react'
import { useStudents, useStudentActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import StudentCard from '../components/StudentCard.jsx'

const STATUSES = ['Present', 'Absent', 'Late']

/**
 * @param {Object} props
 * @param {(id: string) => void} [props.onOpen]
 * @param {() => void} [props.onDone]
 * @returns {JSX.Element}
 */
export default function ListPage({ onOpen, onDone }) {
  const students = useStudents()
  const { select } = useStudentActions()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('Present')

  const filtered = students.filter((student) => {
    const matchesQuery = student.name.toLowerCase().includes(query.toLowerCase()) ||
                         student.id.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = activeStatus === 'All' || student.status === activeStatus
    return matchesQuery && matchesStatus
  })

  const handleSelectStudent = (id) => {
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
          placeholder="Search by name or ID..."
        />
        <FilterTabs
          statuses={STATUSES}
          active={activeStatus}
          onChange={setActiveStatus}
        />
      </div>
      <div>
        {filtered.map((student) => (
          <StudentCard
            key={student.id}
            item={student}
            onSelect={handleSelectStudent}
          />
        ))}
      </div>
    </div>
  )
}
