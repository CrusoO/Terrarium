import { useSelectedOrder } from '../hooks/useData.js'
import StatusBadge from '../components/StatusBadge.jsx'

/**
 * DetailPage component
 * Displays the details of a single selected order
 * @returns {JSX.Element} The detail page view
 */
export default function DetailPage() {
  const selectedOrder = useSelectedOrder()

  if (!selectedOrder) {
    return (
      
        
        <div className="page">
          <p>No order selected</p>
        </div>
      
    )
  }

  return (
    
      
      <div className="page">
        <div className="entity-card">
          <div>
            <p><strong>Order ID:</strong> {selectedOrder.id}</p>
            <p><strong>Customer:</strong> {selectedOrder.customer}</p>
            <p><strong>City:</strong> {selectedOrder.city}</p>
            <p><strong>Pickup Date:</strong> {selectedOrder.pickupDate}</p>
            <p>
              <strong>Payment Status:</strong>{' '}
              <StatusBadge status={selectedOrder.paymentStatus} />
            </p>
          </div>
        </div>
      </div>
    
  )
}
