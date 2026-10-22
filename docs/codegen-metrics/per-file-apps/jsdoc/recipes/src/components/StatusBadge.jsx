/**
 * Displays a status value as a badge. Known statuses map to the
 * scaffold-owned status classes; unknown values render as plain text.
 *
 * @param {Object} props
 * @param {string} props.status - The status label to display, e.g. "Paid".
 * @returns {JSX.Element}
 */
const STATUS_CLASSES = {
  Paid: "status-paid",
  Open: "status-open",
  Unpaid: "status-unpaid",
  Overdue: "status-overdue",
};

export default function StatusBadge({ status }) {
  const className = STATUS_CLASSES[status];

  return <span className={className}>{status}</span>;
}
