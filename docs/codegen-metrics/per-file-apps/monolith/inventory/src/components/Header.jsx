import React from 'react'
import styles from './Header.module.css'
import { CATEGORIES } from '../data/initialItems'

export default function Header({ search, setSearch, filterCategory, setFilterCategory, filterLowStock, setFilterLowStock, onAdd, view }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{view === 'dashboard' ? 'Dashboard' : 'Inventory'}</h1>
      </div>
      {view === 'inventory' && (
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.search}
              type="text"
              placeholder="Search by name or SKU…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <select
            className={styles.select}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            className={`${styles.filterBtn} ${filterLowStock ? styles.active : ''}`}
            onClick={() => setFilterLowStock(v => !v)}
          >
            ⚠ Low Stock
          </button>
          <button className={styles.addBtn} onClick={onAdd}>
            + Add Item
          </button>
        </div>
      )}
    </header>
  )
}
