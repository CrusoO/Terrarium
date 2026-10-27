import { useMemo, useSyncExternalStore } from 'react'
import { SEED_VENUEREQUESTS } from '../data/seed.ts'
import type { VenueRequest } from '../types.ts'
let items: VenueRequest[] = SEED_VENUEREQUESTS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): VenueRequest[] { return items }
export function useVenueRequests() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useVenueRequestActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'VEN-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as VenueRequest])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedVenueRequest(id: string | null = null): VenueRequest | null {
  const rows = useVenueRequests()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
