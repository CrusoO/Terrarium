/**
 * Shows a payment status as a styled badge.
 * Paid, Unpaid, and Partial map to the scaffold status classes.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const classMap = {
    Paid: 'status-paid',
    Unpaid: 'status-unpaid',
    Partial: 'status-open',
  }
  const className = classMap[status] || ''

  return <span className={className}>{status}</span>
}
