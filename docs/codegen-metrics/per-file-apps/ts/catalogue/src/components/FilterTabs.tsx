import type { ReactElement } from "react";

type FilterTabsProps = {
  statuses: string[];
  active: string;
  onChange: (value: string) => void;
};

export default function FilterTabs({ statuses, active, onChange }: FilterTabsProps): ReactElement {
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
