import { useMemo, useSyncExternalStore } from 'react'
import { SEED_BATCHS } from '../data/seed.ts'
import type { Batch, DailyTotal } from '../types.ts'
let items: Batch[] = SEED_BATCHS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Batch[] { return items }
export function useBatchs() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useBatchActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'BAT-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Batch])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedBatch(id: string | null = null): Batch | null {
  const rows = useBatchs()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
export function useTotals(passed?: Batch[]): DailyTotal[] {
  const rows = useBatchs()
  const source: Batch[] = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of source || []) {
      const date = String(item.due || 'undated')
      const amount = 1
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
