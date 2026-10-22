/**
 * Row of status filter buttons.
 * @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props
 */
export default function FilterTabs({ statuses, active, onChange }) {
  const list = Array.isArray(statuses) ? statuses : [];

  return (
    <div className="filter-row" role="group" aria-label="Filter by status">
      {list.map((status) => {
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
