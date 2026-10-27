import React from 'react'

/**
 * Leaf card for a single order. Shows the order summary and reports selection by id.
 *
 * @param {{ item: { id: string, customer: string, city: string, paymentStatus: string, pickupDate: string }, onSelect: (id: string) => void }} props
 * @returns {JSX.Element}
 */
export default function OrderCard({ item, onSelect }) {
  const statusClass = `status-${String(item.paymentStatus).toLowerCase()}`

  return (
    <article className="entity-card">
      <header>
        <strong>{item.id}</strong>
        <span className={statusClass}>{item.paymentStatus}</span>
      </header>
      <p>{item.customer}</p>
      <p>{item.city}</p>
      <p>Pickup: {item.pickupDate}</p>
      <button type="button" onClick={() => onSelect(item.id)}>
        View
      </button>
    </article>
  )
}
