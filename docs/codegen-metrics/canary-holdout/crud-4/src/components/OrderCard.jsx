import React from 'react'

/**
 * Maps a payment status to the scaffold badge class.
 * @param {string} status
 * @returns {string}
 */
function statusClass(status) {
  if (status === 'Paid') return 'status-paid'
  if (status === 'Unpaid') return 'status-unpaid'
  return 'status-open'
}

/**
 * Clickable card summarizing one order.
 * @param {{ item: { id: string, customer: string, city: string, paymentStatus: string, pickupDate: string }, onSelect: (id: string) => void }} props
 * @returns {JSX.Element}
 */
export default function OrderCard({ item, onSelect }) {
  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(item.id)
        }
      }}
    >
      <div className="entity-card-id">{item.id}</div>
      <div className="entity-card-customer">{item.customer}</div>
      <div className="entity-card-city">{item.city}</div>
      <div className="entity-card-pickup">Pickup: {item.pickupDate}</div>
      <span className={statusClass(item.paymentStatus)}>{item.paymentStatus}</span>
    </div>
  )
}
