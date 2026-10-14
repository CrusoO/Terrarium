import { useMemo, useSyncExternalStore } from 'react'
import { SEED_EXPENSES } from '../data/seed.js'
let items = SEED_EXPENSES.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Expense[]} */
export function useExpenses() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useExpenseActions() {
  return {
    addItem(draft) {
      const id = 'EXP-' + String(1000 + items.length + 1)
      items = items.concat([{ ...draft, id }])
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Expense[]} */
/** @returns {Expense | null} */
export function useSelectedExpense(id) {
  const rows = useExpenses()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
/** @returns {DailyTotal[]} */
export function useTotals(passed) {
  const rows = useExpenses()
  const source = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups = {}
    for (const item of source || []) {
      const date = String(item.spentOn || 'undated')
      const amount = Number(item.amount || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
