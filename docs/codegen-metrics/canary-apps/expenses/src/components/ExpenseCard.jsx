import React from 'react'

/**
 * Leaf card that displays one expense and reports its selection.
 *
 * @param {object} props
 * @param {import('../types').Expense} props.item - The expense to display.
 * @param {(id: string) => void} props.onSelect - Called with the expense id when the card is clicked.
 * @returns {JSX.Element}
 */
export default function ExpenseCard({ item, onSelect }) {
  const handleClick = () => {
    onSelect(item.id)
  }

  return (
    <button type="button" className="entity-card" onClick={handleClick}>
      <span className="entity-card-merchant">{item.merchant}</span>
      <span className="entity-card-category">{item.category}</span>
      <span className="entity-card-amount">{Number(item.amount).toFixed(2)}</span>
      <span className="entity-card-date">{item.spentOn}</span>
    </button>
  )
}
