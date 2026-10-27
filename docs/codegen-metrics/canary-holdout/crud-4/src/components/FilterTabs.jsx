/**
 * Row of toggle buttons for filtering orders by payment status.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to render as tabs.
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the clicked status string.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  const items = Array.isArray(statuses) ? statuses : [];

  return (
    <div className="filter-row" role="group" aria-label="Filter by payment status">
      {items.map((status) => {
        const isActive = status === active;
        return (
          <button
            key={status}
            type="button"
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
