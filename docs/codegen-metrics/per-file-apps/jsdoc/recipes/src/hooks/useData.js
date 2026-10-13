import { useMemo, useState } from 'react'
import { SEED_RECIPES } from '../data/seed.js'
/** @returns {Recipe[]} */
export function useRecipes() {
  const [items] = useState(SEED_RECIPES)
  return items
}
/** @returns {{ addItem: (draft: Object) => void }} */
export function useRecipeActions() {
  return { addItem() {} }
}
/** @returns {Recipe | null} */
export function useSelectedRecipe(id) {
  const items = useRecipes()
  return items.find((item) => item.id === id) || null
}
