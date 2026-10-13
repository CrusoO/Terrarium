import type { ReactElement } from "react";

interface FilterTabsProps {
  statuses: string[];
  active: string;
  onChange: (value: string) => void;
}

export default function FilterTabs({ statuses, active, onChange }: FilterTabsProps): ReactElement {
  return (
    <div className="filter-row" role="group" aria-label="Filter by status">
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
