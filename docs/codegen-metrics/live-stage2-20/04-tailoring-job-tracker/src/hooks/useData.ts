import { useMemo, useSyncExternalStore } from 'react'
import { SEED_TAILORINGJOBS } from '../data/seed.ts'
import type { TailoringJob } from '../types.ts'
let items: TailoringJob[] = SEED_TAILORINGJOBS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): TailoringJob[] { return items }
export function useTailoringJobs() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useTailoringJobActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'TAI-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as TailoringJob])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedTailoringJob(id: string | null = null): TailoringJob | null {
  const rows = useTailoringJobs()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
