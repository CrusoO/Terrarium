import { useMemo, useSyncExternalStore } from 'react'
import { SEED_ITEMS } from '../data/seed.ts'
import type { Item } from '../types'
let items: Item[] = SEED_ITEMS.slice()
let selectedId: string | null = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
export function useItems() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useItemActions() {
  return {
    addItem(draft) {
      const row = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'ITE-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id }])
      selectedId = id
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
export function useSelectedItem(id: string | null = null): Item | null {
  const rows = useItems()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
