import { useMemo, useSyncExternalStore } from 'react'
import { SEED_VANS } from '../data/seed.ts'
import type { Van, DailyTotal } from '../types.ts'
let items: Van[] = SEED_VANS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Van[] { return items }
export function useVans() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useVanActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'VAN-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Van])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedVan(id: string | null = null): Van | null {
  const rows = useVans()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
export function useTotals(passed?: Van[]): DailyTotal[] {
  const rows = useVans()
  const source: Van[] = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of source || []) {
      const date = String(item.miles || 'undated')
      const amount = Number(item.miles || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
