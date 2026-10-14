/**
 * ListPage component for displaying and managing orders.
 * Provides search, filtering by payment status, and order selection.
 * @component
 * @returns {JSX.Element} The orders list page
 */

import { useState } from 'react'
import { useOrders, useOrderActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import OrderCard from '../components/OrderCard.jsx'

const STATUSES = ['Paid', 'Unpaid', 'Partial', 'Refunded', 'Held', 'Packed']

/**
 * ListPage - Main list view for orders with search and filtering
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when order is selected
 * @param {Function} [props.onDone] - Callback when action completes
 * @returns {JSX.Element}
 */
export default function ListPage({ onOpen, onDone }) {
  const orders = useOrders()
  const { select } = useOrderActions()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('Paid')

  /**
   * Filter orders by search query and active status
   */
  const filtered = orders.filter((order) => {
    const matchesQuery =
      order.id.toLowerCase().includes(query.toLowerCase()) ||
      order.buyer.toLowerCase().includes(query.toLowerCase()) ||
      order.town.toLowerCase().includes(query.toLowerCase()) ||
      order.phone.toLowerCase().includes(query.toLowerCase())

    const matchesStatus = order.paymentStatus === activeStatus

    return matchesQuery && matchesStatus
  })

  /**
   * Handle order card selection
   * @param {string} id - Order ID
   */
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
          placeholder="Search by ID, buyer, town, or phone..."
        />
      </div>

      <FilterTabs
        statuses={STATUSES}
        active={activeStatus}
        onChange={setActiveStatus}
      />

      <div className="entity-list">
        {filtered.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No orders found
          </p>
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
