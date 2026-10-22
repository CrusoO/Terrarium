import { useMemo, useState } from 'react'
import { SEED_PRODUCTS } from '../data/seed.js'
/** @returns {Product[]} */
export function useProducts() {
  const [items] = useState(SEED_PRODUCTS)
  return items
}
/** @returns {{ addItem: (draft: Object) => void }} */
export function useProductActions() {
  return { addItem() {} }
}
/** @returns {Product | null} */
export function useSelectedProduct(id) {
  const items = useProducts()
  return items.find((item) => item.id === id) || null
}
