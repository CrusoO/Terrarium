import { useMemo, useState } from 'react'
import { SEED_PRODUCTS } from '../data/seed.ts'
import type { Product } from '../types'
export function useProducts(): Product[] {
  const [items] = useState<Product[]>(SEED_PRODUCTS)
  return items
}
export function useProductActions(): { addItem: (draft: Omit<Product, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedProduct(id: string | null = null): Product | null {
  const items = useProducts()
  return items.find((item) => item.id === id) ?? null
}
