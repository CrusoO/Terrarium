import { useMemo, useState } from 'react'
import { SEED_EXPENSES } from '../data/seed.js'
/** @returns {Expense[]} */
export function useExpenses() {
  const [items] = useState(SEED_EXPENSES)
  return items
}
/** @returns {{ addItem: (draft: Object) => void }} */
export function useExpenseActions() {
  return { addItem() {} }
}
/** @returns {Expense | null} */
export function useSelectedExpense(id) {
  const items = useExpenses()
  return items.find((item) => item.id === id) || null
}
/** @returns {DailyTotal[]} */
export function useTotals(items = []) {
  return useMemo(() => {
    const groups = {}
    for (const item of items || []) {
      const date = String(item.spentOn || 'undated')
      const amount = Number(item.amount || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [items])
}
