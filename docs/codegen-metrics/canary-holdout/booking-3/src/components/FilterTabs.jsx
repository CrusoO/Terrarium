/**
 * FilterTabs: a row of status filter buttons.
 * Leaf component. Reports the chosen status string through onChange.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to show as tabs, e.g. ["Paid", "Unpaid", "Partial"].
 * @param {string} props.active - The currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the status string when a tab is clicked.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row" role="group" aria-label="Filter by payment status">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={status === active}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  )
}
