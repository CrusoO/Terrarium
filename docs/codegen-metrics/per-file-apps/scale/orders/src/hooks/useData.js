import { useMemo, useState } from 'react'
import { SEED_ORDERS } from '../data/seed.js'
/** @returns {Order[]} */
export function useOrders() {
  const [items] = useState(SEED_ORDERS)
  return items
}
/** @returns {{ addItem: (draft: Object) => void }} */
export function useOrderActions() {
  return { addItem() {} }
}
/** @returns {Order | null} */
export function useSelectedOrder(id) {
  const items = useOrders()
  return items.find((item) => item.id === id) || null
}
/** @returns {DailyTotal[]} */
export function useTotals(items = []) {
  return useMemo(() => {
    const groups = {}
    for (const item of items || []) {
      const date = String(item.pickupDate || 'undated')
      const amount = 1
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [items])
}
