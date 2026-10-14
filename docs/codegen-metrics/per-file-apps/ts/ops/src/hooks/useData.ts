import { useMemo, useState } from 'react'
import { SEED_JOBS } from '../data/seed.ts'
import type { Job, DailyTotal } from '../types'
export function useJobs(): Job[] {
  const [items] = useState<Job[]>(SEED_JOBS)
  return items
}
export function useJobActions(): { addItem: (draft: Omit<Job, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedJob(id: string | null = null): Job | null {
  const items = useJobs()
  return items.find((item) => item.id === id) ?? null
}
export function useTotals(items: Job[] = []): DailyTotal[] {
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of items || []) {
      const date = String(item.dueDate || 'undated')
      const amount = 1
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [items])
}
