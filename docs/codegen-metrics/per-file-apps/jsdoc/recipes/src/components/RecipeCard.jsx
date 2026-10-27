/**
 * RecipeCard: leaf component that displays one Recipe and reports its id on select.
 *
 * @param {object} props
 * @param {import('../types').Recipe} props.item - The recipe to display.
 * @param {(id: string) => void} props.onSelect - Called with item.id when the card is activated.
 * @returns {JSX.Element}
 */
export default function RecipeCard({ item, onSelect }) {
  const handleClick = () => {
    onSelect(item.id);
  };

  return (
    <button type="button" className="entity-card" onClick={handleClick}>
      <h3>{item.name}</h3>
      <p>{item.course}</p>
      <p>{item.minutes} min</p>
      <p>Serves {item.serves}</p>
    </button>
  );
}
