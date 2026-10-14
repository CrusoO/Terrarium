import { useMemo, useSyncExternalStore } from 'react'
import { SEED_PARTS } from '../data/seed.ts'
import type { Part } from '../types.ts'
let items: Part[] = SEED_PARTS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Part[] { return items }
export function useParts() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function usePartActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'PAR-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Part])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedPart(id: string | null = null): Part | null {
  const rows = useParts()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
