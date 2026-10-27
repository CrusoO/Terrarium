/**
 * StatusBadge renders a guest's RSVP status as a styled pill.
 * Styling comes from the scaffold stylesheet's status-* classes.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - RSVP status: "Yes", "No", or "Maybe".
 *   Also accepts "Paid", "Open", "Unpaid", and "Overdue" for existing callers.
 * @returns {JSX.Element}
 */
const STATUS_CLASSES = {
  Yes: 'status-paid',
  Paid: 'status-paid',
  Maybe: 'status-open',
  Open: 'status-open',
  No: 'status-unpaid',
  Unpaid: 'status-unpaid',
  Overdue: 'status-overdue',
};

export default function StatusBadge({ status }) {
  const className = STATUS_CLASSES[status] ?? '';
  return <span className={`status-badge ${className}`.trim()}>{status}</span>;
}
