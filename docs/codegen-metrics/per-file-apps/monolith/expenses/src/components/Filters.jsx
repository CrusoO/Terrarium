import React from 'react'
import styles from './Filters.module.css'

export default function Filters({
  search, onSearch,
  filterCategory, onCategory,
  filterStaff, onStaff,
  categories, staff,
}) {
  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.search}
          type="text"
          placeholder="Search expenses…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clear} onClick={() => onSearch('')}>✕</button>
        )}
      </div>

      <div className={styles.selects}>
        <div className={styles.selectWrap}>
          <label className={styles.label}>Category</label>
          <select className={styles.select} value={filterCategory} onChange={e => onCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.selectWrap}>
          <label className={styles.label}>Staff Member</label>
          <select className={styles.select} value={filterStaff} onChange={e => onStaff(e.target.value)}>
            <option value="all">All Staff</option>
            {staff.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {(filterCategory !== 'all' || filterStaff !== 'all' || search) && (
        <button className={styles.resetBtn} onClick={() => { onCategory('all'); onStaff('all'); onSearch('') }}>
          Reset Filters
        </button>
      )}
    </div>
  )
}
