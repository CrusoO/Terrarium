import { useMemo, useSyncExternalStore } from 'react'
import { SEED_APPOINTMENTS } from '../data/seed.ts'
import type { Appointment } from '../types.ts'
let items: Appointment[] = SEED_APPOINTMENTS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Appointment[] { return items }
export function useAppointments() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useAppointmentActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'APP-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Appointment])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedAppointment(id: string | null = null): Appointment | null {
  const rows = useAppointments()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
