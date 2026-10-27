import type { Recipe } from "../types";
import StatusBadge from "./StatusBadge";

interface RecipeCardProps {
  item: Recipe;
  onSelect: (id: string) => void;
}

export default function RecipeCard({ item, onSelect }: RecipeCardProps) {
  return (
    <article className="entity-card">
      <h3>{item.name}</h3>
      <StatusBadge status={item.course} />
      <p>
        {item.minutes} min · serves {item.serves}
      </p>
      <button type="button" onClick={() => onSelect(item.id)}>
        View
      </button>
    </article>
  );
}
