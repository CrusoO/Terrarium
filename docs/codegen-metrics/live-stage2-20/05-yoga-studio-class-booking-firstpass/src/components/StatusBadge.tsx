import { useClassBookings, useSelectedClassBooking, useClassBookingActions } from '../hooks/useData.ts'

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const value = String(status ?? '')
  return <span className={`status-${value.toLowerCase()}`}>{value}</span>
}
