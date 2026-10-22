import { useMemo, useSyncExternalStore } from 'react'
import { SEED_ORDERS } from '../data/seed.js'
let items = SEED_ORDERS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Order[]} */
export function useOrders() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useOrderActions() {
  return {
    addItem(draft) {
      const row = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'ORD-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id }])
      selectedId = id
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Order[]} */
/** @returns {Order | null} */
export function useSelectedOrder(id) {
  const rows = useOrders()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
/** @returns {DailyTotal[]} */
export function useTotals(passed) {
  const rows = useOrders()
  const source = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups = {}
    for (const item of source || []) {
      const date = String(item.pickupDate || 'undated')
      const amount = 1
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
