import { useState } from 'react'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import OrderCard from '../components/OrderCard.jsx'
import { useOrders, useOrderActions } from '../hooks/useData.js'
const STATUSES = ["All", "Paid", "Unpaid", "Partial"]
export default function ListPage({ onOpen }) {
  const items = useOrders()
  const { select } = useOrderActions()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('All')
  const visible = items.filter((item) => {
    const statusOk = active === 'All' || item.paymentStatus === active
    return statusOk && JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase())
  })
  return (
    <section className="page">
      <SearchBar value={query} onChange={setQuery} />
      <FilterTabs statuses={STATUSES} active={active} onChange={setActive} />
      {visible.map((item) => <OrderCard key={item.id} item={item} onSelect={(id) => { select(id); onOpen && onOpen(id) }} />)}
    </section>
  )
}
