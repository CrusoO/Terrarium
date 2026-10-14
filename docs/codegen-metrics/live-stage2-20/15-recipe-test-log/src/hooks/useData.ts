import { useMemo, useSyncExternalStore } from 'react'
import { SEED_RECIPETESTS } from '../data/seed.ts'
import type { RecipeTest } from '../types.ts'
let items: RecipeTest[] = SEED_RECIPETESTS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): RecipeTest[] { return items }
export function useRecipeTests() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useRecipeTestActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'REC-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as RecipeTest])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedRecipeTest(id: string | null = null): RecipeTest | null {
  const rows = useRecipeTests()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
