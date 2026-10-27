/**
 * Row of filter tabs for choosing one status value.
 * Leaf component: it renders no shell, title, or hooks.
 *
 * @param {object} props
 * @param {string[]} props.statuses - Status values to show as tabs.
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the status string when a tab is clicked.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row" role="tablist">
      {statuses.map((status) => {
        const isActive = active === status;
        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'filter-tab active' : 'filter-tab'}
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}
