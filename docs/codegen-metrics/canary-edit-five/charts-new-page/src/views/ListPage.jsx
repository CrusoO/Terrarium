import { useState } from 'react'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import PointCard from '../components/PointCard.jsx'
import { usePoints, usePointActions } from '../hooks/useData.js'
const STATUSES = ["All", "Revenue", "Orders"]
export default function ListPage({ onOpen }) {
  const items = usePoints()
  const { select } = usePointActions()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('All')
  const visible = items.filter((item) => {
    const statusOk = active === 'All' || item.series === active
    return statusOk && JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase())
  })
  return (
    <section className="page">
      <SearchBar value={query} onChange={setQuery} />
      <FilterTabs statuses={STATUSES} active={active} onChange={setActive} />
      {visible.map((item) => <PointCard key={item.id} item={item} onSelect={(id) => { select(id); onOpen && onOpen(id) }} />)}
    </section>
  )
}
