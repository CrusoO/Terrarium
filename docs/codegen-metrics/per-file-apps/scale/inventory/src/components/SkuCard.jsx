import StatusBadge from './StatusBadge.jsx';

/**
 * Card showing a single SKU. Clicking it reports the SKU id to the parent.
 *
 * @param {{ item: import('../hooks/useData.js').Sku, onSelect: (id: string) => void }} props
 * @returns {JSX.Element}
 */
export default function SkuCard({ item, onSelect }) {
  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(item.id);
        }
      }}
    >
      <h3>{item.name}</h3>
      <p>{item.aisle}</p>
      <p>On hand: {item.onHand}</p>
      <StatusBadge status={item.status} />
    </div>
  );
}
