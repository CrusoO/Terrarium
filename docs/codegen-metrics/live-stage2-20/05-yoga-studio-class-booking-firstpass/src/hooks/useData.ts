import { useMemo, useSyncExternalStore } from 'react'
import { SEED_CLASSBOOKINGS } from '../data/seed.ts'
import type { ClassBooking } from '../types.ts'
let items: ClassBooking[] = SEED_CLASSBOOKINGS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): ClassBooking[] { return items }
export function useClassBookings() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useClassBookingActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'CLA-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as ClassBooking])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedClassBooking(id: string | null = null): ClassBooking | null {
  const rows = useClassBookings()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
