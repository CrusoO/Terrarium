import { useMemo, useState } from 'react'
import { SEED_GUESTS } from '../data/seed.js'
/** @returns {Guest[]} */
export function useGuests() {
  const [items] = useState(SEED_GUESTS)
  return items
}
/** @returns {{ addItem: (draft: Object) => void }} */
export function useGuestActions() {
  return { addItem() {} }
}
/** @returns {Guest | null} */
export function useSelectedGuest(id) {
  const items = useGuests()
  return items.find((item) => item.id === id) || null
}
