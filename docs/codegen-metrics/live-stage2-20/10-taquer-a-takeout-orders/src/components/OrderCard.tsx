import StatusBadge from './StatusBadge';

interface Order {
  id: string;
  customerName: string;
  tacoItems: string;
  paymentStatus: string;
  orderTime: string;
  totalAmount: number;
}

interface OrderCardProps {
  item: Order;
  onSelect: (id: string) => void;
}

export default function OrderCard({ item, onSelect }: OrderCardProps) {
  const total = typeof item.totalAmount === 'number' ? item.totalAmount.toFixed(2) : String(item.totalAmount ?? '');

  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div>
        <span>ID: </span>
        <span>{String(item.id ?? '')}</span>
      </div>
      <div>
        <span>Customer Name: </span>
        <span>{String(item.customerName ?? '')}</span>
      </div>
      <div>
        <span>Taco Items: </span>
        <span>{String(item.tacoItems ?? '')}</span>
      </div>
      <div>
        <span>Payment Status: </span>
        <StatusBadge status={String(item.paymentStatus ?? '')} />
      </div>
      <div>
        <span>Order Time: </span>
        <span>{String(item.orderTime ?? '')}</span>
      </div>
      <div>
        <span>Total Amount: </span>
        <span>{total}</span>
      </div>
    </button>
  );
}
