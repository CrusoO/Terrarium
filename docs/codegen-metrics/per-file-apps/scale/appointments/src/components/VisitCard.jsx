import StatusBadge from './StatusBadge.jsx';

/**
 * @typedef {Object} Visit
 * @property {string} id
 * @property {string} client
 * @property {string} service
 * @property {string} status
 * @property {string} when
 */

/**
 * Card summarizing one visit. Clicking it reports the visit id.
 * @param {{ item: Visit, onSelect: (id: string) => void }} props
 * @returns {JSX.Element}
 */
export default function VisitCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span className="visit-client">{item.client}</span>
      <span className="visit-service">{item.service}</span>
      <span className="visit-when">{item.when}</span>
      <StatusBadge status={item.status} />
    </button>
  );
}
