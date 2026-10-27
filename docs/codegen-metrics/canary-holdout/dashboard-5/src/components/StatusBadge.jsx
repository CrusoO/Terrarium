/**
 * Shows a payment status as a styled badge.
 * Styling comes from the scaffold stylesheet classes.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const classByStatus = {
    Paid: 'status-paid',
    Unpaid: 'status-unpaid',
    Partial: 'status-open',
  };
  const className = classByStatus[status] ?? '';

  return <span className={className}>{status}</span>;
}
