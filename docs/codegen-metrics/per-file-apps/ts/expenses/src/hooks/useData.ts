import { useMemo, useState } from 'react'
import { SEED_EXPENSES } from '../data/seed.ts'
import type { Expense, DailyTotal } from '../types'
export function useExpenses(): Expense[] {
  const [items] = useState<Expense[]>(SEED_EXPENSES)
  return items
}
export function useExpenseActions(): { addItem: (draft: Omit<Expense, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedExpense(id: string | null = null): Expense | null {
  const items = useExpenses()
  return items.find((item) => item.id === id) ?? null
}
export function useTotals(items: Expense[] = []): DailyTotal[] {
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of items || []) {
      const date = String(item.spentOn || 'undated')
      const amount = Number(item.amount || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [items])
}
