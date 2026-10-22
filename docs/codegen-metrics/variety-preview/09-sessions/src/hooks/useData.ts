import { useMemo, useSyncExternalStore } from 'react'
import { SEED_SESSIONS } from '../data/seed.ts'
import type { Session, DailyTotal } from '../types.ts'
let items: Session[] = SEED_SESSIONS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Session[] { return items }
export function useSessions() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useSessionActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'SES-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Session])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedSession(id: string | null = null): Session | null {
  const rows = useSessions()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
export function useTotals(passed?: Session[]): DailyTotal[] {
  const rows = useSessions()
  const source: Session[] = passed === undefined ? rows : passed
  return useMemo(() => {
    const groups: Record<string, DailyTotal> = {}
    for (const item of source || []) {
      const date = String(item.hours || 'undated')
      const amount = Number(item.hours || 0)
      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }
      groups[date].count += 1
      groups[date].total += amount
    }
    return Object.values(groups)
  }, [source])
}
