import StatusBadge from './StatusBadge.jsx'

/**
 * Leaf card that summarizes one visit and reports selection.
 *
 * @param {object} props
 * @param {import('../types').Visit} props.item - The visit to display.
 * @param {(id: string) => void} props.onSelect - Called with the visit id when the card is chosen.
 * @returns {JSX.Element}
 */
export default function VisitCard({ item, onSelect }) {
  /**
   * Handles card activation by reporting the visit id.
   *
   * @returns {void}
   */
  function handleClick() {
    onSelect(item.id)
  }

  return (
    <button type="button" className="entity-card" onClick={handleClick}>
      <span className="entity-card-id">{item.id}</span>
      <span className="entity-card-client">{item.client}</span>
      <span className="entity-card-service">{item.service}</span>
      <span className="entity-card-when">{item.when}</span>
      <StatusBadge status={item.status} />
    </button>
  )
}
