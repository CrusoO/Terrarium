import { useMemo, useSyncExternalStore } from 'react'
import { SEED_PALLETS } from '../data/seed.ts'
import type { Pallet, DailyTotal } from '../types.ts'
let items: Pallet[] = SEED_PALLETS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Pallet[] { return items }
export function usePallets() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function usePalletActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'PAL-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Pallet])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedPallet(id: string | null = null): Pallet | null {
  const rows = usePallets()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
export function useTotals(passed?: Pallet[]): DailyTotal[] {
  const rows = usePallets()
  const source: Pallet[] = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of source || []) {
      const date = String(item.weight || 'undated')
      const amount = Number(item.weight || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
