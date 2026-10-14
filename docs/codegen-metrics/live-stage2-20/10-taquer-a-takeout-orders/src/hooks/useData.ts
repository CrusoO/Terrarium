import { useMemo, useSyncExternalStore } from 'react'
import { SEED_ORDERS } from '../data/seed.ts'
import type { Order } from '../types.ts'
let items: Order[] = SEED_ORDERS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Order[] { return items }
export function useOrders() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useOrderActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'ORD-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Order])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedOrder(id: string | null = null): Order | null {
  const rows = useOrders()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
