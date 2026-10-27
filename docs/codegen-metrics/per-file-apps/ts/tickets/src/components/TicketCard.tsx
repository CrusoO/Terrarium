import type { Ticket } from "../types";
import StatusBadge from "./StatusBadge";

type TicketCardProps = {
  item: Ticket;
  onSelect: (id: string) => void;
};

export default function TicketCard({ item, onSelect }: TicketCardProps) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div>
        <strong>{item.id}</strong>
        <span> {item.subject}</span>
      </div>
      <div>{item.requester}</div>
      <div>{item.openedOn}</div>
      <StatusBadge status={item.status} />
    </button>
  );
}
