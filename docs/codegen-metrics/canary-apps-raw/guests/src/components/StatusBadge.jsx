/**
 * Renders a small status pill for a guest or record status.
 * Styling comes from the scaffold stylesheet classes.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - Status text, such as "Yes", "No", "Maybe", or "Paid".
 * @returns {JSX.Element}
 */
const STATUS_CLASS = {
  Yes: 'status-paid',
  Paid: 'status-paid',
  Maybe: 'status-open',
  Open: 'status-open',
  No: 'status-unpaid',
  Unpaid: 'status-unpaid',
  Overdue: 'status-overdue',
};

export default function StatusBadge({ status }) {
  const text = status ?? '';
  const modifier = STATUS_CLASS[text] ?? '';

  return (
    <span className={modifier ? `status-badge ${modifier}` : 'status-badge'}>
      {text}
    </span>
  );
}
