import { useSelectedOrder } from '../hooks/useData.js'
import StatusBadge from '../components/StatusBadge.jsx'

/**
 * DetailPage component
 * Displays the details of a selected order
 * @returns {JSX.Element} The detail page
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
            <p><strong>ID:</strong> {selectedOrder.id}</p>
            <p><strong>Customer:</strong> {selectedOrder.customer}</p>
            <p><strong>City:</strong> {selectedOrder.city}</p>
            <p><strong>Payment Status:</strong> <StatusBadge status={selectedOrder.paymentStatus} /></p>
            <p><strong>Pickup Date:</strong> {selectedOrder.pickupDate}</p>
          </div>
        </div>
      </div>
    
  )
}
