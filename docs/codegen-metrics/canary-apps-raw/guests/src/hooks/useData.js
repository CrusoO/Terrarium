import { useMemo, useSyncExternalStore } from 'react'
import { SEED_GUESTS } from '../data/seed.js'
let items = SEED_GUESTS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Guest[]} */
export function useGuests() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useGuestActions() {
  return {
    addItem(draft) {
      const id = 'GUE-' + String(1000 + items.length + 1)
      items = items.concat([{ ...draft, id }])
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Guest[]} */
/** @returns {Guest | null} */
export function useSelectedGuest(id) {
  const rows = useGuests()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
