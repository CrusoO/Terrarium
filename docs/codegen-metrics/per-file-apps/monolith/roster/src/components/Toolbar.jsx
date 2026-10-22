import React from 'react'
import { GRADES } from '../data/students'
import styles from './Toolbar.module.css'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'probation', label: 'Probation' },
]

export default function Toolbar({
  search, onSearch,
  statusFilter, onStatusFilter,
  gradeFilter, onGradeFilter,
  counts, total
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.topRow}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.search}
            type="text"
            placeholder="Search by name, email, or grade…"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => onSearch('')} aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className={styles.filters}>
          <select
            className={styles.select}
            value={gradeFilter}
            onChange={e => onGradeFilter(e.target.value)}
          >
            <option value="all">All Grades</option>
            {GRADES.map(g => <option key={g} value={g}>{g} Grade</option>)}
          </select>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.tabs}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              className={`${styles.tab} ${statusFilter === tab.value ? styles.tabActive : ''}`}
              onClick={() => onStatusFilter(tab.value)}
            >
              {tab.label}
              <span className={`${styles.badge} ${statusFilter === tab.value ? styles.badgeActive : ''}`}>
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>
        <p className={styles.resultCount}>
          Showing <strong>{total}</strong> student{total !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
