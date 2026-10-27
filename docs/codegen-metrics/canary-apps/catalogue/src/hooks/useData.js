import { useMemo, useSyncExternalStore } from 'react'
import { SEED_PRODUCTS } from '../data/seed.js'
let items = SEED_PRODUCTS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Product[]} */
export function useProducts() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useProductActions() {
  return {
    addItem(draft) {
      const id = 'PRO-' + String(1000 + items.length + 1)
      items = items.concat([{ ...draft, id }])
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Product[]} */
/** @returns {Product | null} */
export function useSelectedProduct(id) {
  const rows = useProducts()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
