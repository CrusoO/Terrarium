import { useMemo, useSyncExternalStore } from 'react'
import { SEED_STUDENTS } from '../data/seed.ts'
import type { Student } from '../types'
let items: Student[] = SEED_STUDENTS.slice()
let selectedId: string | null = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
export function useStudents() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useStudentActions() {
  return {
    addItem(draft) {
      const row = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'STU-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id }])
      selectedId = id
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
export function useSelectedStudent(id: string | null = null): Student | null {
  const rows = useStudents()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
