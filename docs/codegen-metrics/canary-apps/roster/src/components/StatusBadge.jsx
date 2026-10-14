/**
 * Displays a student's attendance status as a styled badge.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const modifier = String(status ?? '').toLowerCase()
  return <span className={`status-${modifier}`}>{status}</span>
}
