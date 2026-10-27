/**
 * PickupPage.jsx
 * Displays orders organized by pickup date and window for fulfillment operations.
 * @component
 */

import { useState } from 'react'
import { useOrders, useOrderActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import OrderCard from '../components/OrderCard.jsx'

const STATUSES = ['Paid', 'Unpaid', 'Partial', 'Refunded', 'Held', 'Packed']

/**
 * PickupPage - Manages order pickup scheduling and fulfillment
 * @param {Object} props
 * @param {Function} [props.onOpen] - Callback when order is selected
 * @param {Function} [props.onDone] - Callback when action completes
 * @returns {JSX.Element}
 */
export default function PickupPage({ onOpen, onDone }) {
  const orders = useOrders()
  const { select } = useOrderActions()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('Packed')

  /**
   * Filter orders by search query and payment status
   */
  const filtered = orders.filter((order) => {
    const matchesQuery =
      order.id.toLowerCase().includes(query.toLowerCase()) ||
      order.buyer.toLowerCase().includes(query.toLowerCase()) ||
      order.town.toLowerCase().includes(query.toLowerCase()) ||
      order.phone.includes(query)

    const matchesStatus = activeStatus === 'All' || order.paymentStatus === activeStatus

    return matchesQuery && matchesStatus
  })

  /**
   * Group filtered orders by pickup date and window
   */
  const grouped = filtered.reduce((acc, order) => {
    const key = `${order.pickupDate}|${order.window}`
    if (!acc[key]) {
      acc[key] = {
        date: order.pickupDate,
        window: order.window,
        orders: [],
      }
    }
    acc[key].orders.push(order)
    return acc
  }, {})

  const groups = Object.values(grouped).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    const windowOrder = { Morning: 0, Afternoon: 1, Evening: 2 }
    return (windowOrder[a.window] || 999) - (windowOrder[b.window] || 999)
  })

  /**
   * Handle order selection
   * @param {string} id - Order ID
   */
  const handleSelect = (id) => {
    select(id)
    if (onOpen) onOpen(id)
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

        {groups.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No orders found for the selected filters.
          </div>
        ) : (
          groups.map((group) => (
            <div key={`${group.date}|${group.window}`} style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#333' }}>
                {group.date} - {group.window}
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {group.orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    item={order}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    
  )
}
