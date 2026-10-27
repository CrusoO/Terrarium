import StatusBadge from "./StatusBadge.jsx";

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} customer
 * @property {string} city
 * @property {string} paymentStatus
 * @property {string} pickupDate
 */

/**
 * Clickable summary card for a single order.
 *
 * @param {Object} props
 * @param {Order} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export default function OrderCard({ item, onSelect }) {
  const handleSelect = () => {
    onSelect(item.id);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <h3>{item.customer}</h3>
      <p>{item.id}</p>
      <p>{item.city}</p>
      <p>Pickup: {item.pickupDate}</p>
      <StatusBadge status={item.paymentStatus} />
    </div>
  );
}
