/**
 * Renders a status label as a badge, styled by the scaffold stylesheet.
 * Known statuses map to scaffold classes; unknown values render unstyled.
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
  const className = STATUS_CLASSES[status] ?? '';
  return <span className={className}>{status}</span>;
}
