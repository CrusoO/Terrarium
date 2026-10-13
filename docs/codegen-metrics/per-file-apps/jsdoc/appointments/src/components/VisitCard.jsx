import StatusBadge from "./StatusBadge";

/**
 * @typedef {Object} Visit
 * @property {string} id
 * @property {string} client
 * @property {string} service
 * @property {string} status
 * @property {string} when
 */

/**
 * Card showing one visit. Clicking it reports the visit id.
 *
 * @param {{ item: Visit, onSelect: (id: string) => void }} props
 */
export default function VisitCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span>{item.client}</span>
      <span>{item.service}</span>
      <span>{item.when}</span>
      <StatusBadge status={item.status} />
    </button>
  );
}
