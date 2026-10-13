/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} price
 * @property {number} stock
 */

import StatusBadge from './StatusBadge.jsx';

/**
 * Leaf card that shows one product and reports its id when selected.
 *
 * @param {Object} props
 * @param {Product} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export default function ProductCard({ item, onSelect }) {
  const handleClick = () => {
    onSelect(item.id);
  };

  return (
    <div className="entity-card">
      <h3>{item.name}</h3>
      <StatusBadge status={item.category} />
      <p>Price: {item.price}</p>
      <p>Stock: {item.stock}</p>
      <button type="button" onClick={handleClick}>
        View details
      </button>
    </div>
  );
}
