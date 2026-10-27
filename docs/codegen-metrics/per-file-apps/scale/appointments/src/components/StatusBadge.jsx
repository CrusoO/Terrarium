/**
 * Displays a visit status as a small badge.
 * Statuses: Booked, Done, Cancelled.
 * The class name is derived from the status so scaffold styles can target it.
 *
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const label = String(status ?? '');
  const modifier = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <span className={`status-${modifier}`}>
      {label}
    </span>
  );
}
