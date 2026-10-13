/**
 * FilterTabs: a row of toggle buttons, one per status value.
 * @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props
 */
export default function FilterTabs({ statuses, active, onChange }) {
  const list = Array.isArray(statuses) ? statuses : [];

  return (
    <div className="filter-row" role="group" aria-label="Filter by payment status">
      {list.map((status) => (
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
