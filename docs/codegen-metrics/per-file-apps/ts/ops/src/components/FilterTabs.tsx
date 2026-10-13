export interface FilterTabsProps {
  statuses: string[];
  active: string;
  onChange: (value: string) => void;
}

export default function FilterTabs({ statuses, active, onChange }: FilterTabsProps) {
  return (
    <div className="filter-row">
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
