import { useMemo, useSyncExternalStore } from 'react'
import { SEED_PRODUCES } from '../data/seed.ts'
import type { Produce } from '../types.ts'
let items: Produce[] = SEED_PRODUCES.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Produce[] { return items }
export function useProduces() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useProduceActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'PRO-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Produce])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedProduce(id: string | null = null): Produce | null {
  const rows = useProduces()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
