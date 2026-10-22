import type { Sku } from "../types";

interface SkuCardProps {
  item: Sku;
  onSelect: (id: string) => void;
}

export default function SkuCard({ item, onSelect }: SkuCardProps) {
  return (
    <div className="entity-card">
      <button type="button" onClick={() => onSelect(item.id)}>
        <h3>{item.name}</h3>
      </button>
      <p>{item.id}</p>
      <p>{item.aisle}</p>
      <p>Status: {item.status}</p>
      <p>On hand: {item.onHand}</p>
    </div>
  );
}
