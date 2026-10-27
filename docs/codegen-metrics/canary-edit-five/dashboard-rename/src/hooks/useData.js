import { useMemo, useSyncExternalStore } from 'react'
import { SEED_JOBS } from '../data/seed.js'
let items = SEED_JOBS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Job[]} */
export function useJobs() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useJobActions() {
  return {
    addItem(draft) {
      const row = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = 'JOB-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id }])
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Job[]} */
/** @returns {Job | null} */
export function useSelectedJob(id) {
  const rows = useJobs()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
/** @returns {DailyTotal[]} */
export function useTotals(passed) {
  const rows = useJobs()
  const source = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups = {}
    for (const item of source || []) {
      const date = String(item.dueDate || 'undated')
      const amount = 1
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
