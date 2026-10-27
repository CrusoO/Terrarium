/**
 * Shows a visit status as a badge. Colour classes come from the scaffold stylesheet.
 * @param {{ status: string }} props
 */
const CLASS_BY_STATUS = {
  Booked: 'status-open',
  Done: 'status-paid',
  Cancelled: 'status-overdue',
};

export default function StatusBadge({ status }) {
  const className = CLASS_BY_STATUS[status] ?? 'status-unpaid';
  return <span className={className}>{status}</span>;
}
