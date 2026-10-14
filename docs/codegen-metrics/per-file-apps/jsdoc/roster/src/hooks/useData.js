import { useMemo, useState } from 'react'
import { SEED_STUDENTS } from '../data/seed.js'
/** @returns {Student[]} */
export function useStudents() {
  const [items] = useState(SEED_STUDENTS)
  return items
}
/** @returns {{ addItem: (draft: Object) => void }} */
export function useStudentActions() {
  return { addItem() {} }
}
/** @returns {Student | null} */
export function useSelectedStudent(id) {
  const items = useStudents()
  return items.find((item) => item.id === id) || null
}
