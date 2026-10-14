import { useState } from 'react'
import { useExpenseActions } from '../hooks/useData.js'

/**
 * FormPage component for creating new expenses.
 * Provides a form with controlled inputs for merchant, category, amount, and spentOn date.
 * @component
 * @returns {JSX.Element} The form page wrapped in AppShell
 */
export default function FormPage() {
  const { addItem } = useExpenseActions()
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('Travel')
  const [amount, setAmount] = useState('')
  const [spentOn, setSpentOn] = useState('')

  /**
   * Handles form submission.
   * Creates a new expense object and adds it via the actions hook.
   * @param {Event} e - The form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    addItem({
      merchant,
      category,
      amount: parseFloat(amount),
      spentOn
    })
    setMerchant('')
    setCategory('Travel')
    setAmount('')
    setSpentOn('')
  }

  return (
    
      
      <div className="page">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="merchant">Merchant:</label>
            <input
              id="merchant"
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="category">Category:</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Travel">Travel</option>
              <option value="Meals">Meals</option>
              <option value="Supplies">Supplies</option>
            </select>
          </div>
          <div>
            <label htmlFor="amount">Amount:</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="spentOn">Spent On:</label>
            <input
              id="spentOn"
              type="date"
              value={spentOn}
              onChange={(e) => setSpentOn(e.target.value)}
              required
            />
          </div>
          <button type="submit">Add Expense</button>
        </form>
      </div>
    
  )
}
