import { useMemo, useSyncExternalStore } from 'react'
import { SEED_DOGS } from '../data/seed.ts'
import type { Dog } from '../types.ts'
let items: Dog[] = SEED_DOGS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Dog[] { return items }
export function useDogs() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useDogActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'DOG-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Dog])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedDog(id: string | null = null): Dog | null {
  const rows = useDogs()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
