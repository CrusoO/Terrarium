import { useMemo, useSyncExternalStore } from 'react'
import { SEED_TICKETS } from '../data/seed.js'
let items = SEED_TICKETS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Ticket[]} */
export function useTickets() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useTicketActions() {
  return {
    addItem(draft) {
      const id = 'TIC-' + String(1000 + items.length + 1)
      items = items.concat([{ ...draft, id }])
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Ticket[]} */
/** @returns {Ticket | null} */
export function useSelectedTicket(id) {
  const rows = useTickets()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
