export interface FilterTabsProps {
  statuses: string[];
  active: string;
  onChange: (value: string) => void;
}

export default function FilterTabs({ statuses, active, onChange }: FilterTabsProps) {
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
            className={isActive ? "filter-tab active" : "filter-tab"}
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}
