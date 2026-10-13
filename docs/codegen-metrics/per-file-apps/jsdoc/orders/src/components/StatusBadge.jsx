/**
 * Shows a payment status as a styled label.
 * Styling comes from the scaffold stylesheet classes.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const classMap = {
    Paid: 'status-paid',
    Unpaid: 'status-unpaid',
    Partial: 'status-open',
  };
  const modifier = classMap[status] || '';
  const className = modifier ? `status-badge ${modifier}` : 'status-badge';

  return <span className={className}>{status}</span>;
}
