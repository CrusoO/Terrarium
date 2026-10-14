import { useState } from 'react'
import SearchBar from '../components/SearchBar.tsx'
import FilterTabs from '../components/FilterTabs.tsx'
import SkuCard from '../components/SkuCard.tsx'
import { useSkus, useSkuActions } from '../hooks/useData.ts'
const STATUSES = ["All", "Ok", "Low", "Out"]
export default function ListPage({ onOpen }) {
  const items = useSkus()
  const { select } = useSkuActions()
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
      {visible.map((item) => <SkuCard key={item.id} item={item} onSelect={(id) => { select(id); onOpen && onOpen(id) }} />)}
    </section>
  )
}
