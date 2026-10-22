import { useMemo, useSyncExternalStore } from 'react'
import { SEED_RESERVATIONS } from '../data/seed.ts'
import type { Reservation } from '../types.ts'
let items: Reservation[] = SEED_RESERVATIONS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Reservation[] { return items }
export function useReservations() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useReservationActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'RES-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Reservation])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedReservation(id: string | null = null): Reservation | null {
  const rows = useReservations()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
