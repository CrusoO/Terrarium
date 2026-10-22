/**
 * Displays a status value as a small inline badge.
 * Known statuses map to scaffold-owned classes; unknown values render unstyled.
 *
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
const STATUS_CLASSES = {
  Paid: 'status-paid',
  Open: 'status-open',
  Unpaid: 'status-unpaid',
  Overdue: 'status-overdue',
};

export default function StatusBadge({ status }) {
  const className = STATUS_CLASSES[status] || undefined;
  return <span className={className}>{status}</span>;
}
