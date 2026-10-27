import { useMemo, useState } from 'react'
import { SEED_TICKETS } from '../data/seed.ts'
import type { Ticket } from '../types'
export function useTickets(): Ticket[] {
  const [items] = useState<Ticket[]>(SEED_TICKETS)
  return items
}
export function useTicketActions(): { addItem: (draft: Omit<Ticket, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedTicket(id: string | null = null): Ticket | null {
  const items = useTickets()
  return items.find((item) => item.id === id) ?? null
}
