/**
 * ProductCard: leaf component that renders one Product as a selectable card.
 *
 * @param {object} props
 * @param {{ id: string, name: string, category: string, price: number, stock: number }} props.item
 *   The product to display.
 * @param {(id: string) => void} props.onSelect
 *   Called with the product id when the card is activated.
 * @returns {JSX.Element}
 */
export default function ProductCard({ item, onSelect }) {
  function handleClick() {
    onSelect(item.id)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(item.id)
    }
  }

  return (
    <article
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <h3>{item.name}</h3>
      <p>{item.category}</p>
      <p>${item.price}</p>
      <p>Stock: {item.stock}</p>
    </article>
  )
}
