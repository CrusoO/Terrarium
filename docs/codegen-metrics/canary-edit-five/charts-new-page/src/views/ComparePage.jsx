import React, { useState } from 'react';
import { usePoints, useSelectedPoint, usePointActions, useTotals } from '../hooks/useData.js';
import SearchBar from '../components/SearchBar.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import PointCard from '../components/PointCard.jsx';
import TotalsCard from '../components/TotalsCard.jsx';

/**
 * ComparePage - Compare sales data across different series and time periods
 * @component
 * @returns {React.ReactElement} The compare page with filtering and totals
 */
export default function ComparePage() {
  const points = usePoints();
  const selectedPoint = useSelectedPoint();
  const { select } = usePointActions();
  const totals = useTotals();

  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('Revenue');

  const statuses = ['Revenue', 'Orders'];

  const filteredPoints = points.filter((point) => {
    const matchesQuery =
      String(point.label ?? '').toLowerCase().includes(query.toLowerCase()) ||
      String(point.id ?? '').toLowerCase().includes(query.toLowerCase());

    const matchesStatus = point.series === activeStatus;

    return matchesQuery && matchesStatus;
  });

  const handleSelectPoint = (id) => {
    select(id);
  };

  return (
    <div className="page">
      <div className="filter-row">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by label or ID..."
        />
        <FilterTabs
          statuses={statuses}
          active={activeStatus}
          onChange={setActiveStatus}
        />
      </div>

      <div className="totals-grid">
        <TotalsCard totals={totals} />
      </div>

      <div className="entity-card">
        {filteredPoints.length > 0 ? (
          filteredPoints.map((point) => (
            <PointCard
              key={point.id}
              item={point}
              onSelect={handleSelectPoint}
            />
          ))
        ) : (
          <p>No data points found</p>
        )}
      </div>
    </div>
  );
}
