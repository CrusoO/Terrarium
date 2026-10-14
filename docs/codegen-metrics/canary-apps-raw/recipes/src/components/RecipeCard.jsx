/**
 * RecipeCard: leaf component that shows one Recipe and reports selection by id.
 *
 * @param {object} props
 * @param {import('../types').Recipe} props.item - The recipe to display.
 * @param {(id: string) => void} props.onSelect - Called with item.id when the card is clicked.
 * @returns {JSX.Element}
 */
export default function RecipeCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span>{item.name}</span>
      <span>{item.course}</span>
      <span>{item.minutes} min</span>
      <span>Serves {item.serves}</span>
    </button>
  )
}
