/**
 * Row of toggle tabs for choosing one status from a list.
 *
 * @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props
 *   statuses: the status values to show as tabs
 *   active: the currently selected status
 *   onChange: called with the status string when a tab is clicked
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
            className={isActive ? 'filter-tab is-active' : 'filter-tab'}
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
