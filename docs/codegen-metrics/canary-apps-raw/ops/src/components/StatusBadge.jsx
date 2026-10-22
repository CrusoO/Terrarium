/**
 * Shows a job status as a badge. The colour comes from the scaffold stylesheet classes.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
const STATUS_CLASS = {
  Open: 'status-open',
  Done: 'status-paid',
  Overdue: 'status-overdue',
  Paid: 'status-paid',
  Unpaid: 'status-unpaid',
}

export default function StatusBadge({ status }) {
  const variant = STATUS_CLASS[status] ?? ''
  return <span className={variant}>{status}</span>
}
