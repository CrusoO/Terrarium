import StatusBadge from './StatusBadge.jsx'

/**
 * Card summarising one Sku. Activating the card reports its id.
 * @param {{ item: { id: string, name: string, aisle: string, status: string, onHand: number }, onSelect: (id: string) => void }} props
 */
export default function SkuCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span>{item.name}</span>
      <span>{item.aisle}</span>
      <span>On hand: {item.onHand}</span>
      <StatusBadge status={item.status} />
    </button>
  )
}
