import { useMemo, useSyncExternalStore } from 'react'
import { SEED_WALKS } from '../data/seed.ts'
import type { Walk } from '../types.ts'
let items: Walk[] = SEED_WALKS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Walk[] { return items }
export function useWalks() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useWalkActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'WAL-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Walk])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedWalk(id: string | null = null): Walk | null {
  const rows = useWalks()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
