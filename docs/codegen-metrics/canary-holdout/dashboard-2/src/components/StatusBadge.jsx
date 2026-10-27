/**
 * StatusBadge renders a payment status label with the scaffold status class.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
const STATUS_CLASS = {
  Paid: 'status-paid',
  Unpaid: 'status-unpaid',
  Partial: 'status-open',
}

export default function StatusBadge({ status }) {
  const className = STATUS_CLASS[status] ?? 'status-open'
  return <span className={className}>{status}</span>
}
