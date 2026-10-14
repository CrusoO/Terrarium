import React from 'react';
import StatusBadge from './StatusBadge';

/**
 * @typedef {Object} Ticket
 * @property {string} id
 * @property {string} subject
 * @property {string} requester
 * @property {string} status
 * @property {string} openedOn
 */

/**
 * Card view for a single ticket. Clicking it reports the ticket id.
 *
 * @param {Object} props
 * @param {Ticket} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export default function TicketCard({ item, onSelect }) {
  return (
    <article className="entity-card">
      <button type="button" onClick={() => onSelect(item.id)}>
        <h3>{item.subject}</h3>
        <p>{item.requester}</p>
        <p>{item.openedOn}</p>
      </button>
      <StatusBadge status={item.status} />
    </article>
  );
}
