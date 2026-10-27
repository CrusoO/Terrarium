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
