import StatusBadge from './StatusBadge.jsx'

/**
 * Clickable card summarising one SKU.
 *
 * @param {object} props
 * @param {{ id: string, name: string, aisle: string, status: string, onHand: number }} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export default function SkuCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span className="entity-card-name">{item.name}</span>
      <span className="entity-card-aisle">{item.aisle}</span>
      <span className="entity-card-on-hand">On hand: {item.onHand}</span>
      <StatusBadge status={item.status} />
    </button>
  )
}
