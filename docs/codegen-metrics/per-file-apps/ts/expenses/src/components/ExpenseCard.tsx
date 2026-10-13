import type { Expense } from '../types';

type ExpenseCardProps = {
  item: Expense;
  onSelect: (id: string) => void;
};

export default function ExpenseCard({ item, onSelect }: ExpenseCardProps) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span>{item.merchant}</span>
      <span>{item.category}</span>
      <span>{item.amount.toFixed(2)}</span>
      <span>{item.spentOn}</span>
    </button>
  );
}
