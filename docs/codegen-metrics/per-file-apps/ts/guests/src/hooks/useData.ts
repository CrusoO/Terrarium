import { useMemo, useState } from 'react'
import { SEED_GUESTS } from '../data/seed.ts'
import type { Guest } from '../types'
export function useGuests(): Guest[] {
  const [items] = useState<Guest[]>(SEED_GUESTS)
  return items
}
export function useGuestActions(): { addItem: (draft: Omit<Guest, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedGuest(id: string | null = null): Guest | null {
  const items = useGuests()
  return items.find((item) => item.id === id) ?? null
}
