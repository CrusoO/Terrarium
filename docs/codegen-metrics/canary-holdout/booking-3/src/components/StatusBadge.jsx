/**
 * Shows a payment status as a styled badge.
 * Paid, Unpaid, and Partial map to scaffold classes. Any other value falls back to status-open.
 * @param {{ status: string }} props
 * @returns {import('react').ReactElement}
 */
export default function StatusBadge({ status }) {
  const classByStatus = {
    Paid: 'status-paid',
    Unpaid: 'status-unpaid',
    Partial: 'status-open',
  }
  const className = classByStatus[status] ?? 'status-open'
  return <span className={className}>{status}</span>
}
