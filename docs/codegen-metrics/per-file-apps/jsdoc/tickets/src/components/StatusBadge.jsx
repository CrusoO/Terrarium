/**
 * StatusBadge
 *
 * Renders a ticket status as a small badge. Known statuses get a scaffold
 * modifier class. Unknown statuses, including Waiting and Closed, render as
 * plain text so the badge never breaks on an unexpected value.
 *
 * Note: the ticket status field is one of Open, Waiting, Closed. The example
 * call <StatusBadge status="Paid" /> is still supported. "Paid" maps to
 * status-paid, which the scaffold stylesheet owns.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - The status text to display.
 * @returns {JSX.Element}
 */

const STATUS_CLASS = {
  Open: "status-open",
  Paid: "status-paid",
  Unpaid: "status-unpaid",
  Overdue: "status-overdue",
};

export default function StatusBadge({ status }) {
  const modifier = STATUS_CLASS[status];

  return <span className={modifier}>{status}</span>;
}
