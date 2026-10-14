import React from "react";

/**
 * Renders a row of filter buttons, one per status.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to render as tabs (e.g. Kitchen, Garden, Desk).
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the clicked status string.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row" role="tablist">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          role="tab"
          aria-selected={status === active}
          aria-pressed={status === active}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
