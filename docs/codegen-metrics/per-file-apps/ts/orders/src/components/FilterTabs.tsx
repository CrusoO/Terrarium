export default function FilterTabs({
  statuses,
  active,
  onChange,
}: {
  statuses: string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="filter-row" role="group" aria-label="Filter by payment status">
      {statuses.map((status) => (
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
