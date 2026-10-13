import { useState, useMemo } from 'react'
import { INITIAL_EXPENSES } from '../data/initialExpenses'

let nextId = 200

export function useExpenses() {
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES)

  const addExpense = (expense) => {
    setExpenses(prev => [{ ...expense, id: nextId++ }, ...prev])
  }

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const totals = useMemo(() => {
    const byCategory = {}
    let grand = 0
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
      grand += e.amount
    })
    return { byCategory, grand }
  }, [expenses])

  return { expenses, addExpense, deleteExpense, totals }
}
