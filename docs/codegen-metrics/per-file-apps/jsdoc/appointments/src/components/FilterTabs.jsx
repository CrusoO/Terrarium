/**
 * Row of toggle buttons for filtering visits by status.
 * Leaf component: receives plain props and renders no hooks.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to show as tabs (e.g. Booked, Done, Cancelled).
 * @param {string} props.active - The currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the status string when a tab is clicked.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row">
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
  );
}
