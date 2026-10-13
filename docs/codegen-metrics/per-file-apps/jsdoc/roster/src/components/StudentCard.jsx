/**
 * @typedef {Object} Student
 * @property {string} id
 * @property {string} name
 * @property {string} homeroom
 * @property {string} status
 * @property {string} guardian
 */

/**
 * Leaf card that displays one student and reports selection by id.
 *
 * @param {Object} props
 * @param {Student} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export default function StudentCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span className="entity-card-name">{item.name}</span>
      <span className="entity-card-homeroom">Homeroom {item.homeroom}</span>
      <span className="entity-card-status">{item.status}</span>
      <span className="entity-card-guardian">Guardian: {item.guardian}</span>
    </button>
  );
}
