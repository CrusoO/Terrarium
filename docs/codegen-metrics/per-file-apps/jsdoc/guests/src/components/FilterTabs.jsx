/**
 * Horizontal row of status filter buttons.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to render as tabs, e.g. ["Yes", "No", "Maybe"].
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the clicked status string.
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
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
