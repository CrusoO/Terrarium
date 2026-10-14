import { useState } from 'react'
import SearchBar from '../components/SearchBar.tsx'
import PageHero from '../components/PageHero.tsx'
import EmptyState from '../components/EmptyState.tsx'
import FilterTabs from '../components/FilterTabs.tsx'
import SaleCard from '../components/SaleCard.tsx'
import { useSales, useSaleActions } from '../hooks/useData.ts'
const STATUSES = ["All", "January", "February", "March", "April"]
export default function ListPage({ onOpen }: { onOpen?: (id: string) => void }) {
  const items = useSales()
  const { select } = useSaleActions()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('All')
  const visible = items.filter((item) => {
    const statusOk = active === 'All' || String(item.month ?? '') === active
    const haystack = Object.values(item).map((value) => String(value ?? '')).join(' ').toLowerCase()
    return statusOk && haystack.includes(query.trim().toLowerCase())
  })
  return (
    <section className="page">
      <PageHero />
      <SearchBar value={query} onChange={setQuery} />
      <FilterTabs statuses={STATUSES} active={active} onChange={setActive} />
      {visible.length === 0 ? <EmptyState /> : null}
      {visible.map((item) => <SaleCard key={item.id} item={item} onSelect={(id) => { select(id); onOpen && onOpen(id) }} />)}
    </section>
  )
}
