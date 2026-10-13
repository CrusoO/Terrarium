/**
 * ProductCard: a leaf card that shows one product and reports its id on select.
 *
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} price
 * @property {number} stock
 */

import StatusBadge from "./StatusBadge.jsx";

/**
 * @param {Object} props
 * @param {Product} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export default function ProductCard({ item, onSelect }) {
  return (
    <article className="entity-card">
      <h3>{item.name}</h3>
      <StatusBadge status={item.category} />
      <p>Price: {item.price}</p>
      <p>Stock: {item.stock}</p>
      <button type="button" onClick={() => onSelect(item.id)}>
        View
      </button>
    </article>
  );
}
