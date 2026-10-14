import { useMemo, useSyncExternalStore } from 'react'
import { SEED_POINTS } from '../data/seed.js'
let items = SEED_POINTS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Point[]} */
export function usePoints() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function usePointActions() {
  return {
    addItem(draft) {
      const row = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'POI-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id }])
      selectedId = id
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Point[]} */
/** @returns {Point | null} */
export function useSelectedPoint(id) {
  const rows = usePoints()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
/** @returns {DailyTotal[]} */
export function useTotals(passed) {
  const rows = usePoints()
  const source = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups = {}
    for (const item of source || []) {
      const date = String(item.phone || 'undated')
      const amount = Number(item.value || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
