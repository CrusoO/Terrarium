import StatusBadge from './StatusBadge';

/**
 * Leaf card for a single SKU. Clicking it reports the SKU id to the parent.
 *
 * @param {Object} props
 * @param {Sku} props.item - The SKU to display.
 * @param {(id: string) => void} props.onSelect - Called with item.id when the card is clicked.
 */
export default function SkuCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <h3>{item.name}</h3>
      <p>{item.aisle}</p>
      <p>On hand: {item.onHand}</p>
      <StatusBadge status={item.status} />
    </button>
  );
}
