import type { Product } from "../types";
import StatusBadge from "./StatusBadge";

type ProductCardProps = {
  item: Product;
  onSelect: (id: string) => void;
};

export default function ProductCard({ item, onSelect }: ProductCardProps) {
  return (
    <article className="entity-card">
      <h3>{item.name}</h3>
      <p>{item.id}</p>
      <StatusBadge status={item.category} />
      <p>Price: {item.price}</p>
      <p>Stock: {item.stock}</p>
      <button type="button" onClick={() => onSelect(item.id)}>
        View
      </button>
    </article>
  );
}
