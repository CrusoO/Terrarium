import { useMemo, useState } from 'react'
import { SEED_VISITS } from '../data/seed.ts'
import type { Visit } from '../types'
export function useVisits(): Visit[] {
  const [items] = useState<Visit[]>(SEED_VISITS)
  return items
}
export function useVisitActions(): { addItem: (draft: Omit<Visit, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedVisit(id: string | null = null): Visit | null {
  const items = useVisits()
  return items.find((item) => item.id === id) ?? null
}
