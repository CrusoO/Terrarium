import { useMemo, useSyncExternalStore } from 'react'
import { SEED_ELECTRICITYREADINGS } from '../data/seed.ts'
import type { ElectricityReading, DailyTotal } from '../types.ts'
let items: ElectricityReading[] = SEED_ELECTRICITYREADINGS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): ElectricityReading[] { return items }
export function useElectricityReadings() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useElectricityReadingActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'ELE-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as ElectricityReading])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedElectricityReading(id: string | null = null): ElectricityReading | null {
  const rows = useElectricityReadings()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
export function useTotals(passed?: ElectricityReading[]): DailyTotal[] {
  const rows = useElectricityReadings()
  const source: ElectricityReading[] = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of source || []) {
      const date = String(item.isHighest || 'undated')
      const amount = Number(item.usage || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
