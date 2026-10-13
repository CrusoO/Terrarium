/**
 * @typedef {{ id: string, name: string, homeroom: string, status: string, guardian: string }} Student
 */

/**
 * Leaf card for one student. Selecting the card reports its id.
 *
 * @param {{ item: Student, onSelect: (id: string) => void }} props
 */
export default function StudentCard({ item, onSelect }) {
  const statusClass = `status-${String(item.status).toLowerCase()}`

  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span className="entity-card-name">{item.name}</span>
      <span className="entity-card-homeroom">Homeroom {item.homeroom}</span>
      <span className="entity-card-guardian">Guardian: {item.guardian}</span>
      <span className={statusClass}>{item.status}</span>
    </button>
  )
}
