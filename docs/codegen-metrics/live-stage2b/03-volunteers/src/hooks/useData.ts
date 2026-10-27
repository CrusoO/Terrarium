import { useMemo, useSyncExternalStore } from 'react'
import { SEED_VOLUNTEERS } from '../data/seed.ts'
import type { Volunteer } from '../types.ts'
let items: Volunteer[] = SEED_VOLUNTEERS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Volunteer[] { return items }
export function useVolunteers() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useVolunteerActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'VOL-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Volunteer])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedVolunteer(id: string | null = null): Volunteer | null {
  const rows = useVolunteers()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
