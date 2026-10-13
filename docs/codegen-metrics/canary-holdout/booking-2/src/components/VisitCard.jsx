/**
 * VisitCard: a leaf card that shows one visit and reports selection.
 *
 * @param {{ item: { id: string, client: string, service: string, status: string, when: string }, onSelect: (id: string) => void }} props
 * @returns {JSX.Element}
 */
export default function VisitCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div>{item.client}</div>
      <div>{item.service}</div>
      <div>{item.when}</div>
      <span>{item.status}</span>
    </button>
  )
}
