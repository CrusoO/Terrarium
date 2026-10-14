import { useMemo, useSyncExternalStore } from 'react'
import { SEED_RECIPES } from '../data/seed.js'
let items = SEED_RECIPES.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Recipe[]} */
export function useRecipes() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useRecipeActions() {
  return {
    addItem(draft) {
      const id = 'REC-' + String(1000 + items.length + 1)
      items = items.concat([{ ...draft, id }])
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Recipe[]} */
/** @returns {Recipe | null} */
export function useSelectedRecipe(id) {
  const rows = useRecipes()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
