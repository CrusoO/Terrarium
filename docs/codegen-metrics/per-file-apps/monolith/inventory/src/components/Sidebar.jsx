import React from 'react'
import styles from './Sidebar.module.css'

const lowStockCount = (items) => items.filter(i => i.stock <= i.minStock).length
const totalItems = (items) => items.reduce((s, i) => s + i.stock, 0)

export default function Sidebar({ view, setView, items }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>📦</span>
        <span className={styles.logoText}>InvCount</span>
      </div>

      <nav className={styles.nav}>
        <button
          className={`${styles.navItem} ${view === 'dashboard' ? styles.active : ''}`}
          onClick={() => setView('dashboard')}
        >
          <span className={styles.navIcon}>▦</span>
          Dashboard
        </button>
        <button
          className={`${styles.navItem} ${view === 'inventory' ? styles.active : ''}`}
          onClick={() => setView('inventory')}
        >
          <span className={styles.navIcon}>☰</span>
          Inventory
        </button>
      </nav>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{items.length}</div>
          <div className={styles.statLabel}>Total SKUs</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalItems(items).toLocaleString()}</div>
          <div className={styles.statLabel}>Total Units</div>
        </div>
        <div className={`${styles.statCard} ${lowStockCount(items) > 0 ? styles.danger : ''}`}>
          <div className={styles.statValue}>{lowStockCount(items)}</div>
          <div className={styles.statLabel}>Low Stock</div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.user}>
          <div className={styles.avatar}>S</div>
          <div>
            <div className={styles.userName}>Staff User</div>
            <div className={styles.userRole}>Inventory Manager</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
