import React from 'react'
import StatusBadge from './StatusBadge'
import styles from './StudentTable.module.css'

const COLUMNS = [
  { key: 'lastName',  label: 'Name' },
  { key: 'grade',     label: 'Grade' },
  { key: 'gpa',       label: 'GPA' },
  { key: 'status',    label: 'Status' },
  { key: 'email',     label: 'Email' },
]

export default function StudentTable({ students, onSelect, selectedId, sortConfig, onSort }) {
  function SortIcon({ col }) {
    if (sortConfig.key !== col) return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity=".3">
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>
      </svg>
    )
    return sortConfig.dir === 'asc'
      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 15l5 5 5-5"/></svg>
      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 9l5-5 5 5"/></svg>
  }

  if (students.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p>No students match your search</p>
        <span>Try adjusting your filters</span>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th key={col.key} onClick={() => onSort(col.key)} className={styles.th}>
                <span className={styles.thInner}>
                  {col.label}
                  <SortIcon col={col.key} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr
              key={student.id}
              className={`${styles.row} ${selectedId === student.id ? styles.rowSelected : ''}`}
              onClick={() => onSelect(student)}
            >
              <td className={styles.td}>
                <div className={styles.nameCell}>
                  <div className={styles.avatar} data-status={student.status}>
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <div className={styles.fullName}>{student.firstName} {student.lastName}</div>
                    <div className={styles.emailSmall}>{student.email}</div>
                  </div>
                </div>
              </td>
              <td className={styles.td}>
                <span className={styles.gradeChip}>{student.grade}</span>
              </td>
              <td className={styles.td}>
                <span className={`${styles.gpa} ${student.gpa >= 3.5 ? styles.gpaHigh : student.gpa >= 2.5 ? styles.gpaMid : styles.gpaLow}`}>
                  {student.gpa.toFixed(1)}
                </span>
              </td>
              <td className={styles.td}>
                <StatusBadge status={student.status} />
              </td>
              <td className={`${styles.td} ${styles.emailCol}`}>{student.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
