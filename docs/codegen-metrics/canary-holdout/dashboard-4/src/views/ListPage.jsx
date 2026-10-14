import { useState } from 'react'
import { useOrders, useOrderActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import OrderCard from '../components/OrderCard.jsx'

/**
 * ListPage component for displaying and filtering orders.
 * Provides search functionality, status filtering, and order selection.
 * @component
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when an order is selected
 * @param {Function} [props.onDone] - Callback when action completes
 * @returns {JSX.Element} The rendered list page
 */
export default function ListPage({ onOpen, onDone }) {
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const orders = useOrders()
  const { select } = useOrderActions()

  const STATUSES = ['All', 'Paid', 'Unpaid', 'Partial']

  const filtered = orders.filter((order) => {
    const matchesQuery =
      order.customer.toLowerCase().includes(query.toLowerCase()) ||
      order.city.toLowerCase().includes(query.toLowerCase()) ||
      order.id.toLowerCase().includes(query.toLowerCase())

    const matchesStatus =
      activeStatus === 'All' || order.paymentStatus === activeStatus

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
          placeholder="Search by customer, city, or order ID..."
        />
        <FilterTabs
          statuses={STATUSES}
          active={activeStatus}
          onChange={setActiveStatus}
        />
      </div>

      <div>
        {filtered.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order.id}
              item={order}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
