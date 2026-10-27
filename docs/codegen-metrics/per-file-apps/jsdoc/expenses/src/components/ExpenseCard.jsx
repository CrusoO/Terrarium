import StatusBadge from './StatusBadge';

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} merchant
 * @property {string} category
 * @property {number} amount
 * @property {string} spentOn
 */

/**
 * Displays a single expense as a selectable card.
 *
 * @param {Object} props
 * @param {Expense} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export default function ExpenseCard({ item, onSelect }) {
  const handleClick = () => {
    onSelect(item.id);
  };

  return (
    <button type="button" className="entity-card" onClick={handleClick}>
      <div className="entity-card-header">
        <span className="entity-card-merchant">{item.merchant}</span>
        <StatusBadge status={item.category} />
      </div>
      <div className="entity-card-body">
        <span className="entity-card-amount">{item.amount.toFixed(2)}</span>
        <span className="entity-card-date">{item.spentOn}</span>
      </div>
    </button>
  );
}
