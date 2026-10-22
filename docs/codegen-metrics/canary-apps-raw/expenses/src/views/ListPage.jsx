import { useState } from 'react'
import { useExpenses, useSelectedExpense, useExpenseActions } from '../hooks/useData.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import ExpenseCard from '../components/ExpenseCard.jsx'

const CATEGORIES = ['Travel', 'Meals', 'Supplies']

/**
 * ListPage component for displaying and filtering expenses.
 * @component
 * @param {Object} props - Component props
 * @param {Function} [props.onOpen] - Callback when an expense is selected
 * @param {Function} [props.onDone] - Callback when action completes
 * @returns {JSX.Element} The list page with search, filter, and expense cards
 */
export default function ListPage({ onOpen, onDone }) {
  const expenses = useExpenses()
  const { select } = useExpenseActions()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Travel')

  const filtered = expenses.filter((expense) => {
    const matchesQuery =
      expense.merchant.toLowerCase().includes(query.toLowerCase()) ||
      expense.id.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = expense.category === activeCategory
    return matchesQuery && matchesCategory
  })

  const handleSelectExpense = (id) => {
    select(id)
    if (onOpen) {
      onOpen(id)
    }
  }

  return (
    <div className="page">
      <div className="filter-row">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by merchant or ID..."
        />
        <FilterTabs
          statuses={CATEGORIES}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      </div>
      <div>
        {filtered.map((expense) => (
          <ExpenseCard
            key={expense.id}
            item={expense}
            onSelect={handleSelectExpense}
          />
        ))}
      </div>
    </div>
  )
}
