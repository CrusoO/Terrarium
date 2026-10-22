import { useMemo, useSyncExternalStore } from 'react'
import { SEED_VISITS } from '../data/seed.js'
let items = SEED_VISITS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Visit[]} */
export function useVisits() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useVisitActions() {
  return {
    addItem(draft) {
      const id = 'VIS-' + String(1000 + items.length + 1)
      items = items.concat([{ ...draft, id }])
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Visit[]} */
/** @returns {Visit | null} */
export function useSelectedVisit(id) {
  const rows = useVisits()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
