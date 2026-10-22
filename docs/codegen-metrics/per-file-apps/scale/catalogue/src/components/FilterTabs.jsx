/**
 * FilterTabs renders one button per status inside the scaffold filter row.
 * The active status is highlighted, and clicking a tab reports its value through onChange.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to show as tabs, for example Kitchen, Garden, Desk.
 * @param {string} props.active - The currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the status string when a tab is clicked.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row">
      {statuses.map((status) => {
        const isActive = status === active;
        return (
          <button
            key={status}
            type="button"
            className={isActive ? "active" : ""}
            aria-pressed={isActive}
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}
