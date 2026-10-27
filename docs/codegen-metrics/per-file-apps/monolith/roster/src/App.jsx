import React, { useState, useMemo } from 'react'
import { INITIAL_STUDENTS } from './data/students'
import Toolbar from './components/Toolbar'
import StudentTable from './components/StudentTable'
import StudentDetail from './components/StudentDetail'
import AddStudentModal from './components/AddStudentModal'
import styles from './App.module.css'

export default function App() {
  const [students, setStudents] = useState(INITIAL_STUDENTS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'lastName', dir: 'asc' })

  const filtered = useMemo(() => {
    let list = students.filter(s => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter
      return matchSearch && matchStatus && matchGrade
    })

    list = [...list].sort((a, b) => {
      const av = a[sortConfig.key] ?? ''
      const bv = b[sortConfig.key] ?? ''
      const cmp = typeof av === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortConfig.dir === 'asc' ? cmp : -cmp
    })

    return list
  }, [students, search, statusFilter, gradeFilter, sortConfig])

  function handleSort(key) {
    setSortConfig(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }

  function handleAddStudent(data) {
    const newStudent = {
      ...data,
      id: Date.now(),
    }
    setStudents(prev => [...prev, newStudent])
    setShowAdd(false)
  }

  function handleUpdateStudent(updated) {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s))
    setSelectedStudent(updated)
  }

  function handleDeleteStudent(id) {
    setStudents(prev => prev.filter(s => s.id !== id))
    setSelectedStudent(null)
  }

  const counts = useMemo(() => ({
    all: students.length,
    active: students.filter(s => s.status === 'active').length,
    inactive: students.filter(s => s.status === 'inactive').length,
    probation: students.filter(s => s.status === 'probation').length,
  }), [students])

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="currentColor"/>
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="currentColor" opacity=".7"/>
              </svg>
            </div>
            <div>
              <h1 className={styles.title}>Class Roster</h1>
              <p className={styles.subtitle}>Advanced Biology · Period 3 · Ms. Rivera</p>
            </div>
          </div>
          <button className={styles.addBtn} onClick={() => setShowAdd(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Student
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Toolbar
          search={search}
          onSearch={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          gradeFilter={gradeFilter}
          onGradeFilter={setGradeFilter}
          counts={counts}
          total={filtered.length}
        />

        <div className={styles.content}>
          <StudentTable
            students={filtered}
            onSelect={setSelectedStudent}
            selectedId={selectedStudent?.id}
            sortConfig={sortConfig}
            onSort={handleSort}
          />

          {selectedStudent && (
            <StudentDetail
              student={selectedStudent}
              onClose={() => setSelectedStudent(null)}
              onUpdate={handleUpdateStudent}
              onDelete={handleDeleteStudent}
            />
          )}
        </div>
      </main>

      {showAdd && (
        <AddStudentModal
          onAdd={handleAddStudent}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
