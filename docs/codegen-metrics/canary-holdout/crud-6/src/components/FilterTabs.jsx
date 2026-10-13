/**
 * Row of status filter tabs.
 * @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props
 */
export default function FilterTabs({ statuses, active, onChange }) {
  const list = Array.isArray(statuses) ? statuses : [];

  return (
    <div className="filter-row" role="tablist">
      {list.map((status) => {
        const isActive = status === active;
        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'filter-tab filter-tab-active' : 'filter-tab'}
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}
