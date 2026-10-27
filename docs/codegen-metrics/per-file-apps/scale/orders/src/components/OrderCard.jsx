/**
 * Leaf card that summarizes one Order and reports selection by id.
 * @param {{ item: import('../types.js').Order, onSelect: (id: string) => void }} props
 * @returns {JSX.Element}
 */
import React from 'react';
import StatusBadge from './StatusBadge.jsx';

export default function OrderCard({ item, onSelect }) {
  const handleClick = () => {
    onSelect(item.id);
  };

  return (
    <button type="button" className="entity-card" onClick={handleClick}>
      <div className="entity-card-header">
        <span className="entity-card-id">{item.id}</span>
        <StatusBadge status={item.paymentStatus} />
      </div>
      <div className="entity-card-customer">{item.customer}</div>
      <div className="entity-card-meta">
        <span className="entity-card-city">{item.city}</span>
        <span className="entity-card-pickup">{item.pickupDate}</span>
      </div>
    </button>
  );
}
