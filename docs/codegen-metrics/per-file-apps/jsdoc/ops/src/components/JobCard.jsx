import React from "react";
import StatusBadge from "./StatusBadge.jsx";

/**
 * Renders one job as a selectable card.
 *
 * @param {object} props
 * @param {import("../types").Job} props.item - Job entity with id, title, owner, status, dueDate.
 * @param {(id: string) => void} props.onSelect - Called with item.id when the card is activated.
 * @returns {JSX.Element}
 */
export default function JobCard({ item, onSelect }) {
  const handleActivate = () => {
    onSelect(item.id);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <h3>{item.title}</h3>
      <p>Owner: {item.owner}</p>
      <p>Due: {item.dueDate}</p>
      <StatusBadge status={item.status} />
    </div>
  );
}
