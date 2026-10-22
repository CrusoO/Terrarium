import { useMemo, useSyncExternalStore } from 'react'
import { SEED_SALES } from '../data/seed.ts'
import type { Sale, DailyTotal } from '../types.ts'
let items: Sale[] = SEED_SALES.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Sale[] { return items }
export function useSales() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useSaleActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'SAL-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Sale])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedSale(id: string | null = null): Sale | null {
  const rows = useSales()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
export function useTotals(passed?: Sale[]): DailyTotal[] {
  const rows = useSales()
  const source: Sale[] = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of source || []) {
      const date = String(item.averageOrderValue || 'undated')
      const amount = Number(item.total || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
