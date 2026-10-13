import { useMemo, useSyncExternalStore } from 'react'
import { SEED_SKUS } from '../data/seed.js'
let items = SEED_SKUS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Sku[]} */
export function useSkus() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useSkuActions() {
  return {
    addItem(draft) {
      const id = 'SKU-' + String(1000 + items.length + 1)
      items = items.concat([{ ...draft, id }])
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Sku[]} */
/** @returns {Sku | null} */
export function useSelectedSku(id) {
  const rows = useSkus()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
/** @returns {DailyTotal[]} */
export function useTotals(passed) {
  const rows = useSkus()
  const source = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups = {}
    for (const item of source || []) {
      const date = String(item.onHand || 'undated')
      const amount = Number(item.onHand || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
