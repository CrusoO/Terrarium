/**
 * FilterTabs renders a row of status filter buttons.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to show as tabs.
 * @param {string} props.active - The currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the chosen status string.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row" role="group" aria-label="Filter by status">
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
