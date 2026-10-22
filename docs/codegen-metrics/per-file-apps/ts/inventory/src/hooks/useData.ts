import { useMemo, useState } from 'react'
import { SEED_SKUS } from '../data/seed.ts'
import type { Sku, DailyTotal } from '../types'
export function useSkus(): Sku[] {
  const [items] = useState<Sku[]>(SEED_SKUS)
  return items
}
export function useSkuActions(): { addItem: (draft: Omit<Sku, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedSku(id: string | null = null): Sku | null {
  const items = useSkus()
  return items.find((item) => item.id === id) ?? null
}
export function useTotals(items: Sku[] = []): DailyTotal[] {
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of items || []) {
      const date = String(item.onHand || 'undated')
      const amount = Number(item.onHand || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [items])
}
