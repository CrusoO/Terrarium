/**
 * Horizontal row of status filter tabs.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to show as tabs.
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the status string when a tab is clicked.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row" role="tablist">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          role="tab"
          aria-selected={status === active}
          className={status === active ? "filter-tab active" : "filter-tab"}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
