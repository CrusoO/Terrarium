import { useMemo, useState } from 'react'
import { SEED_SKUS } from '../data/seed.js'
/** @returns {Sku[]} */
export function useSkus() {
  const [items] = useState(SEED_SKUS)
  return items
}
/** @returns {{ addItem: (draft: Object) => void }} */
export function useSkuActions() {
  return { addItem() {} }
}
/** @returns {Sku | null} */
export function useSelectedSku(id) {
  const items = useSkus()
  return items.find((item) => item.id === id) || null
}
/** @returns {DailyTotal[]} */
export function useTotals(items = []) {
  return useMemo(() => {
    const groups = {}
    for (const item of items || []) {
      const date = String(item.onHand || 'undated')
      const amount = Number(item.onHand || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [items])
}
