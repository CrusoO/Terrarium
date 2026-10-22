import { useMemo, useSyncExternalStore } from 'react'
import { SEED_BAYS } from '../data/seed.ts'
import type { Bay, DailyTotal } from '../types.ts'
let items: Bay[] = SEED_BAYS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Bay[] { return items }
export function useBays() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useBayActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'BAY-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Bay])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedBay(id: string | null = null): Bay | null {
  const rows = useBays()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
export function useTotals(passed?: Bay[]): DailyTotal[] {
  const rows = useBays()
  const source: Bay[] = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of source || []) {
      const date = String(item.timeStarted || 'undated')
      const amount = Number(item.bayNumber || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
