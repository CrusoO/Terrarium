/**
 * DetailPage component for displaying a single order's details.
 * @component
 * @returns {JSX.Element} The detail page displaying selected order information
 */

import { useSelectedOrder } from '../hooks/useData.js'

/**
 * DetailPage - Renders detailed information about a selected order.
 * Displays all order fields in a read-only format.
 *
 * @returns {JSX.Element} Detail view of the selected order or empty state
 */
export default function DetailPage() {
  const selectedOrder = useSelectedOrder()

  if (!selectedOrder) {
    return (
      <div className="page">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No order selected
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="entity-card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Order ID
            </label>
            <div style={{ fontSize: '1rem', fontWeight: '500' }}>
              {selectedOrder.id}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Buyer
            </label>
            <div style={{ fontSize: '1rem', fontWeight: '500' }}>
              {selectedOrder.buyer}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Town
            </label>
            <div style={{ fontSize: '1rem' }}>
              {selectedOrder.town}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Phone
            </label>
            <div style={{ fontSize: '1rem' }}>
              {selectedOrder.phone}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Payment Status
            </label>
            <div style={{ fontSize: '1rem', fontWeight: '500' }}>
              {selectedOrder.paymentStatus}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Pickup Date
            </label>
            <div style={{ fontSize: '1rem' }}>
              {selectedOrder.pickupDate}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Window
            </label>
            <div style={{ fontSize: '1rem' }}>
              {selectedOrder.window}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
              Note
            </label>
            <div style={{ fontSize: '1rem' }}>
              {selectedOrder.note || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
