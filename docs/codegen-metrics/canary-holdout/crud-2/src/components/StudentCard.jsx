import StatusBadge from './StatusBadge.jsx'

/**
 * Clickable card summarizing one Student.
 *
 * @param {Object} props
 * @param {Student} props.item - The student to display.
 * @param {(id: string) => void} props.onSelect - Called with item.id when the card is clicked.
 * @returns {JSX.Element}
 */
export default function StudentCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div className="entity-card-name">{item.name}</div>
      <div className="entity-card-homeroom">Homeroom {item.homeroom}</div>
      <div className="entity-card-guardian">Guardian: {item.guardian}</div>
      <StatusBadge status={item.status} />
    </button>
  )
}
