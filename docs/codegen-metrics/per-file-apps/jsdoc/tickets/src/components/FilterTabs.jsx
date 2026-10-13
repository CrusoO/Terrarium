import React from "react";

/**
 * Horizontal row of status filter tabs.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to render as tabs.
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the selected status string.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
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
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}
