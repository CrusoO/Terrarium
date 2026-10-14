import { useMemo, useSyncExternalStore } from 'react'
import { SEED_LEADS } from '../data/seed.js'
let items = SEED_LEADS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Lead[]} */
export function useLeads() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useLeadActions() {
  return {
    addItem(draft) {
      const row = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'LEA-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id }])
      selectedId = id
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Lead[]} */
/** @returns {Lead | null} */
export function useSelectedLead(id) {
  const rows = useLeads()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
