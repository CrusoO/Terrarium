import { useState } from 'react'
import SearchBar from '../components/SearchBar.tsx'
import FilterTabs from '../components/FilterTabs.tsx'
import StudentCard from '../components/StudentCard.tsx'
import { useStudents, useStudentActions } from '../hooks/useData.ts'
const STATUSES = ["All", "Present", "Absent", "Late"]
export default function ListPage({ onOpen }) {
  const items = useStudents()
  const { select } = useStudentActions()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('All')
  const visible = items.filter((item) => {
    const statusOk = active === 'All' || String(item.status ?? '') === active
    const haystack = Object.values(item).map((value) => String(value ?? '')).join(' ').toLowerCase()
    return statusOk && haystack.includes(query.trim().toLowerCase())
  })
  return (
    <section className="page">
      <SearchBar value={query} onChange={setQuery} />
      <FilterTabs statuses={STATUSES} active={active} onChange={setActive} />
      {visible.map((item) => <StudentCard key={item.id} item={item} onSelect={(id) => { select(id); onOpen && onOpen(id) }} />)}
    </section>
  )
}
