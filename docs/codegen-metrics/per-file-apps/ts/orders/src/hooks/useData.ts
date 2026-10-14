import { useMemo, useState } from 'react'
import { SEED_ORDERS } from '../data/seed.ts'
import type { Order, DailyTotal } from '../types'
export function useOrders(): Order[] {
  const [items] = useState<Order[]>(SEED_ORDERS)
  return items
}
export function useOrderActions(): { addItem: (draft: Omit<Order, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedOrder(id: string | null = null): Order | null {
  const items = useOrders()
  return items.find((item) => item.id === id) ?? null
}
export function useTotals(items: Order[] = []): DailyTotal[] {
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of items || []) {
      const date = String(item.pickupDate || 'undated')
      const amount = 1
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [items])
}
