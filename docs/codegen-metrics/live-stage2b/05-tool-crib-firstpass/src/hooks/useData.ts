import { useMemo, useSyncExternalStore } from 'react'
import { SEED_TOOLS } from '../data/seed.ts'
import type { Tool } from '../types.ts'
let items: Tool[] = SEED_TOOLS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Tool[] { return items }
export function useTools() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useToolActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'TOO-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Tool])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedTool(id: string | null = null): Tool | null {
  const rows = useTools()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
