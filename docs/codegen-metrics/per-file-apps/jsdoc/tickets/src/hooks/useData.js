import { useMemo, useState } from 'react'
import { SEED_TICKETS } from '../data/seed.js'
/** @returns {Ticket[]} */
export function useTickets() {
  const [items] = useState(SEED_TICKETS)
  return items
}
/** @returns {{ addItem: (draft: Object) => void }} */
export function useTicketActions() {
  return { addItem() {} }
}
/** @returns {Ticket | null} */
export function useSelectedTicket(id) {
  const items = useTickets()
  return items.find((item) => item.id === id) || null
}
