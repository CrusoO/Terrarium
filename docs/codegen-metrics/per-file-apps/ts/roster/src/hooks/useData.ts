import { useMemo, useState } from 'react'
import { SEED_STUDENTS } from '../data/seed.ts'
import type { Student } from '../types'
export function useStudents(): Student[] {
  const [items] = useState<Student[]>(SEED_STUDENTS)
  return items
}
export function useStudentActions(): { addItem: (draft: Omit<Student, 'id'>) => void } {
  return { addItem() {} }
}
export function useSelectedStudent(id: string | null = null): Student | null {
  const items = useStudents()
  return items.find((item) => item.id === id) ?? null
}
