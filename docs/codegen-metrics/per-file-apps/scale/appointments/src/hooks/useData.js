import { useMemo, useState } from 'react'
import { SEED_VISITS } from '../data/seed.js'
/** @returns {Visit[]} */
export function useVisits() {
  const [items] = useState(SEED_VISITS)
  return items
}
/** @returns {{ addItem: (draft: Object) => void }} */
export function useVisitActions() {
  return { addItem() {} }
}
/** @returns {Visit | null} */
export function useSelectedVisit(id) {
  const items = useVisits()
  return items.find((item) => item.id === id) || null
}
