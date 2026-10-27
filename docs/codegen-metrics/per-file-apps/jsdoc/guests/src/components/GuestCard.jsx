/**
 * Card showing one guest summary. Clicking it reports the guest id upward.
 * @param {{ item: import("../types").Guest, onSelect: (id: string) => void }} props
 */
import StatusBadge from "./StatusBadge";

export default function GuestCard({ item, onSelect }) {
  const handleClick = () => {
    onSelect(item.id);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <h3>{item.name}</h3>
      <p>Party: {item.party}</p>
      <p>Seats: {item.seats}</p>
      <StatusBadge status={item.status} />
    </div>
  );
}
