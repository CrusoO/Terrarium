/**
 * Small pill showing an order's payment status.
 * Paid maps to status-paid, Unpaid to status-unpaid, and Partial to status-open.
 * Styling comes from the scaffold stylesheet.
 *
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const classByStatus = {
    Paid: 'status-paid',
    Unpaid: 'status-unpaid',
    Partial: 'status-open',
  };
  const className = classByStatus[status] ?? 'status-open';

  return <span className={className}>{status}</span>;
}
