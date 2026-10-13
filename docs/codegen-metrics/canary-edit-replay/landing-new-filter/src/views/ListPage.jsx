import { useState } from 'react'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import LeadCard from '../components/LeadCard.jsx'
import { useLeads, useLeadActions } from '../hooks/useData.js'
const STATUSES = ["All", "Studio", "Workshop", "Private", "Waiting"]
export default function ListPage({ onOpen }) {
  const items = useLeads()
  const { select } = useLeadActions()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('All')
  const visible = items.filter((item) => {
    const statusOk = active === 'All' || String(item.plan ?? '') === active
    const haystack = Object.values(item).map((value) => String(value ?? '')).join(' ').toLowerCase()
    return statusOk && haystack.includes(query.trim().toLowerCase())
  })
  return (
    <section className="page">
      <SearchBar value={query} onChange={setQuery} />
      <FilterTabs statuses={STATUSES} active={active} onChange={setActive} />
      {visible.map((item) => <LeadCard key={item.id} item={item} onSelect={(id) => { select(id); onOpen && onOpen(id) }} />)}
    </section>
  )
}
