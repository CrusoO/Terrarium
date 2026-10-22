/**
 * StatusBadge: leaf component that shows a visit status as a styled label.
 * Uses only scaffold-owned status classes.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - Visit status: Booked, Done, or Cancelled.
 * @returns {JSX.Element}
 */

const STATUS_CLASS = {
  Booked: 'status-open',
  Done: 'status-paid',
  Cancelled: 'status-overdue',
};

export default function StatusBadge({ status }) {
  const tone = STATUS_CLASS[status] ?? 'status-unpaid';
  return <span className={tone}>{status}</span>;
}
