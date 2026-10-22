/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} title
 * @property {string} owner
 * @property {string} status
 * @property {string} dueDate
 */

/**
 * Leaf card that displays one Job and reports its id when selected.
 *
 * @param {Object} props
 * @param {Job} props.item - The job to display.
 * @param {(id: string) => void} props.onSelect - Called with item.id when the card is clicked.
 * @returns {JSX.Element}
 */
import StatusBadge from './StatusBadge.jsx';

export default function JobCard({ item, onSelect }) {
  return (
    <div className="entity-card">
      <button type="button" onClick={() => onSelect(item.id)}>
        <h3>{item.title}</h3>
      </button>
      <p>Owner: {item.owner}</p>
      <p>Due: {item.dueDate}</p>
      <StatusBadge status={item.status} />
    </div>
  );
}
