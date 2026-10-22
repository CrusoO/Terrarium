import { useState } from 'react'
import { useSkus, useSkuActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import SkuCard from '../components/SkuCard.jsx'

/**
 * ListPage component for displaying and filtering SKUs
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when a SKU is selected
 * @param {Function} [props.onDone] - Callback when action is complete
 * @returns {JSX.Element} The list page view
 */
export default function ListPage({ onOpen, onDone }) {
  const skus = useSkus()
  const { select } = useSkuActions()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')

  const STATUSES = ['All', 'Ok', 'Low', 'Out']

  const filtered = skus.filter((sku) => {
    const matchesQuery = sku.name.toLowerCase().includes(query.toLowerCase()) ||
                         sku.id.toLowerCase().includes(query.toLowerCase()) ||
                         sku.aisle.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = activeStatus === 'All' || sku.status === activeStatus
    return matchesQuery && matchesStatus
  })

  const handleSelect = (id) => {
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
          placeholder="Search by name, ID, or aisle..."
        />
        <FilterTabs
          statuses={STATUSES}
          active={activeStatus}
          onChange={setActiveStatus}
        />
      </div>
      <div className="list-container">
        {filtered.map((sku) => (
          <SkuCard
            key={sku.id}
            item={sku}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  )
}
