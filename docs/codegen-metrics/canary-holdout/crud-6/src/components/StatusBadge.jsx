/**
 * Leaf component that renders a payment status as a styled label.
 * Known statuses map to scaffold-owned classes. Unknown values render unstyled.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - One of "Paid", "Unpaid", or "Partial".
 * @returns {JSX.Element}
 */
const STATUS_CLASS = {
  Paid: 'status-paid',
  Unpaid: 'status-unpaid',
  Partial: 'status-open'
}

export default function StatusBadge({ status }) {
  const className = STATUS_CLASS[status]

  return <span className={className}>{status}</span>
}
