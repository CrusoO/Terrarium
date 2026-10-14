import { useMemo, useState } from 'react'
import { SEED_RECIPES } from '../data/seed.ts'
import type { Recipe } from '../types'
export function useRecipes(): Recipe[] {
  const [items] = useState<Recipe[]>(SEED_RECIPES)
  return items
}
export function useRecipeActions(): { addItem: (draft: Omit<Recipe, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedRecipe(id: string | null = null): Recipe | null {
  const items = useRecipes()
  return items.find((item) => item.id === id) ?? null
}
