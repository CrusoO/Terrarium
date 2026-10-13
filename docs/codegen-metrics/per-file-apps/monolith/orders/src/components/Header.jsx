import React from 'react'
import { STATUSES } from '../data/seed'
import styles from './Header.module.css'

export default function Header({ search, onSearch, statusFilter, onStatusFilter, onCreateOrder, activeTab, onTabChange }) {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.logo}>🛒</span>
          <div>
            <h1 className={styles.title}>Order Tracker</h1>
            <p className={styles.subtitle}>Staff Dashboard</p>
          </div>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`}
            onClick={() => onTabChange('orders')}
          >
            Orders
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'totals' ? styles.tabActive : ''}`}
            onClick={() => onTabChange('totals')}
          >
            Daily Totals
          </button>
        </div>
        <button className={styles.createBtn} onClick={onCreateOrder}>
          <span>+</span> New Order
        </button>
      </div>
      {activeTab === 'orders' && (
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.search}
              type="text"
              placeholder="Search by order ID or customer name…"
              value={search}
              onChange={e => onSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => onSearch('')}>✕</button>
            )}
          </div>
          <div className={styles.filters}>
            <span className={styles.filterLabel}>Status:</span>
            {['All', ...STATUSES].map(s => (
              <button
                key={s}
                className={`${styles.filterBtn} ${statusFilter === s ? styles.filterActive : ''}`}
                onClick={() => onStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
