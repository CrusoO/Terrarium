/**
 * ArchivePage.jsx
 * Archive view for Orders - displays archived/historical orders
 * @component
 */

import { useState } from 'react'
import { useOrders } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import OrderCard from '../components/OrderCard.jsx'

const STATUSES = ['Paid', 'Unpaid', 'Partial', 'Refunded', 'Held', 'Packed']

/**
 * ArchivePage - displays archived orders with search and filter capabilities
 * @param {Object} props - component props
 * @param {Function} [props.onOpen] - callback when order is selected
 * @param {Function} [props.onDone] - callback when action completes
 * @returns {JSX.Element} archive page
 */
export default function ArchivePage({ onOpen, onDone }) {
  const orders = useOrders()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')

  /**
   * Filter orders by search query and status
   */
  const filtered = orders.filter((order) => {
    const matchesQuery =
      order.id.toLowerCase().includes(query.toLowerCase()) ||
      order.buyer.toLowerCase().includes(query.toLowerCase()) ||
      order.town.toLowerCase().includes(query.toLowerCase()) ||
      order.phone.includes(query)

    const matchesStatus =
      activeStatus === 'All' || order.paymentStatus === activeStatus

    return matchesQuery && matchesStatus
  })

  /**
   * Handle order card selection
   * @param {string} id - order id
   */
  const handleSelect = (id) => {
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
          <FilterTabs
            statuses={STATUSES}
            active={activeStatus}
            onChange={setActiveStatus}
          />
        </div>

        <div className="orders-list">
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No archived orders found
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
