import { useMemo, useSyncExternalStore } from 'react'
import { SEED_BOOKS } from '../data/seed.ts'
import type { Book } from '../types.ts'
let items: Book[] = SEED_BOOKS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Book[] { return items }
export function useBooks() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useBookActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'BOO-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Book])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedBook(id: string | null = null): Book | null {
  const rows = useBooks()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
