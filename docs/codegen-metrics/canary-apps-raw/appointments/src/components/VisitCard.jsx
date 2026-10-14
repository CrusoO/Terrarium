/**
 * VisitCard: a single clickable visit summary.
 * @param {{ item: import('../types').Visit, onSelect: (id: string) => void }} props
 */
import StatusBadge from './StatusBadge.jsx'

export default function VisitCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div>
        <strong>{item.client}</strong>
        <div>{item.service}</div>
        <div>{item.when}</div>
      </div>
      <StatusBadge status={item.status} />
    </button>
  )
}
