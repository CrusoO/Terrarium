import { useMemo, useSyncExternalStore } from 'react'
import { SEED_STUDENTS } from '../data/seed.js'
let items = SEED_STUDENTS.slice()
let selectedId = null
const listeners = new Set()
function emit() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot() { return items }
/** @returns {Student[]} */
export function useStudents() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useStudentActions() {
  return {
    addItem(draft) {
      const id = 'STU-' + String(1000 + items.length + 1)
      items = items.concat([{ ...draft, id }])
      emit()
    },
    select(id) { selectedId = id; emit() },
  }
}
/** @returns {Student[]} */
/** @returns {Student | null} */
export function useSelectedStudent(id) {
  const rows = useStudents()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) || null
}
