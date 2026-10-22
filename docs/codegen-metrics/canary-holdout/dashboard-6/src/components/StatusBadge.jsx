/**
 * StatusBadge
 *
 * Leaf component that renders a visit status as a small badge.
 * Visit statuses are Booked, Done, and Cancelled. Unknown values fall back
 * to a neutral style so callers passing other labels still render.
 *
 * @param {Object} props
 * @param {string} props.status - The status label to display.
 * @returns {JSX.Element}
 */
const STATUS_CLASSES = {
  Booked: 'status-open',
  Done: 'status-paid',
  Cancelled: 'status-overdue',
  Paid: 'status-paid',
}

export default function StatusBadge({ status }) {
  const label = typeof status === 'string' ? status : ''
  const className = STATUS_CLASSES[label] || 'status-unpaid'

  return <span className={className}>{label}</span>
}
