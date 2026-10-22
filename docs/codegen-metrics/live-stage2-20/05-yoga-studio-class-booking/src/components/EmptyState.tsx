import { useClassBookings, useSelectedClassBooking, useClassBookingActions } from '../hooks/useData.ts'

export default function EmptyState() {
  return (
    <div className="page">
      <p>No booking has been scheduled yet.</p>
    </div>
  )
}
