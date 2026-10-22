import { useMemo, useSyncExternalStore } from 'react'
import { SEED_SKUS } from '../data/seed.ts'
import type { Sku, DailyTotal } from '../types'
let items: Sku[] = SEED_SKUS.slice()
let selectedId: string | null = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
export function useSkus() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useSkuActions() {
  return {
    addItem(draft) {
      const row = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'SKU-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id }])
      selectedId = id
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
export function useSelectedSku(id: string | null = null): Sku | null {
  const rows = useSkus()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
export function useTotals(passed?: Sku[]): DailyTotal[] {
  const rows = useSkus()
  const source = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of source || []) {
      const date = String(item.onHand || 'undated')
      const amount = Number(item.onHand || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
