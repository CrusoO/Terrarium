import { useMemo, useSyncExternalStore } from 'react'
import { SEED_PLANTS } from '../data/seed.ts'
import type { Plant } from '../types.ts'
let items: Plant[] = SEED_PLANTS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Plant[] { return items }
export function usePlants() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function usePlantActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'PLA-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Plant])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedPlant(id: string | null = null): Plant | null {
  const rows = usePlants()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
