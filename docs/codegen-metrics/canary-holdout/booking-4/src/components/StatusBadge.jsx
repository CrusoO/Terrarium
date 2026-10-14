/**
 * Shows an order's paymentStatus as a colored badge.
 * Paid, Unpaid, and Partial map to scaffold status classes.
 * @param {{ status: string }} props
 */
const STATUS_CLASS = {
  Paid: 'status-paid',
  Unpaid: 'status-unpaid',
  Partial: 'status-open',
}

export default function StatusBadge({ status }) {
  return <span className={STATUS_CLASS[status]}>{status}</span>
}
