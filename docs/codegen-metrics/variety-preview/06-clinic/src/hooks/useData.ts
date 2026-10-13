import { useMemo, useSyncExternalStore } from 'react'
import { SEED_SUPPLYS } from '../data/seed.ts'
import type { Supply } from '../types.ts'
let items: Supply[] = SEED_SUPPLYS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Supply[] { return items }
export function useSupplys() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useSupplyActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'SUP-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Supply])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedSupply(id: string | null = null): Supply | null {
  const rows = useSupplys()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
