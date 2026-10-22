import type { Order } from "../types";
import StatusBadge from "./StatusBadge";

interface OrderCardProps {
  item: Order;
  onSelect: (id: string) => void;
}

export default function OrderCard({ item, onSelect }: OrderCardProps) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div className="entity-card-id">{item.id}</div>
      <div className="entity-card-customer">{item.customer}</div>
      <div className="entity-card-city">{item.city}</div>
      <div className="entity-card-pickup">{item.pickupDate}</div>
      <StatusBadge status={item.paymentStatus} />
    </button>
  );
}
