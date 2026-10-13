/**
 * FilterTabs: a row of toggle buttons for choosing one status filter.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to render as tabs, e.g. ["Open", "Done", "Overdue"].
 * @param {string} props.active - The currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the chosen status string.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row" role="tablist">
      {statuses.map((status) => {
        const isActive = status === active;
        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}
