import React from 'react'
import styles from './Dashboard.module.css'
import { CATEGORIES } from '../data/initialItems'

export default function Dashboard({ items, onSelectItem }) {
  const totalUnits = items.reduce((s, i) => s + i.stock, 0)
  const totalValue = items.reduce((s, i) => s + i.stock * i.price, 0)
  const lowStock = items.filter(i => i.stock <= i.minStock)
  const outOfStock = items.filter(i => i.stock === 0)

  const byCategory = CATEGORIES.map(cat => {
    const catItems = items.filter(i => i.category === cat)
    return {
      name: cat,
      count: catItems.length,
      units: catItems.reduce((s, i) => s + i.stock, 0),
      value: catItems.reduce((s, i) => s + i.stock * i.price, 0),
    }
  }).filter(c => c.count > 0)

  const maxUnits = Math.max(...byCategory.map(c => c.units), 1)

  return (
    <div className={styles.dashboard}>
      <div className={styles.kpiRow}>
        <div className={styles.kpi}>
          <div className={styles.kpiIcon}>📦</div>
          <div>
            <div className={styles.kpiValue}>{items.length}</div>
            <div className={styles.kpiLabel}>Total SKUs</div>
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiIcon}>🔢</div>
          <div>
            <div className={styles.kpiValue}>{totalUnits.toLocaleString()}</div>
            <div className={styles.kpiLabel}>Total Units</div>
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiIcon}>💰</div>
          <div>
            <div className={styles.kpiValue}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className={styles.kpiLabel}>Stock Value</div>
          </div>
        </div>
        <div className={`${styles.kpi} ${lowStock.length > 0 ? styles.warn : ''}`}>
          <div className={styles.kpiIcon}>⚠️</div>
          <div>
            <div className={styles.kpiValue}>{lowStock.length}</div>
            <div className={styles.kpiLabel}>Low Stock Items</div>
          </div>
        </div>
        <div className={`${styles.kpi} ${outOfStock.length > 0 ? styles.danger : ''}`}>
          <div className={styles.kpiIcon}>🚫</div>
          <div>
            <div className={styles.kpiValue}>{outOfStock.length}</div>
            <div className={styles.kpiLabel}>Out of Stock</div>
          </div>
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Stock by Category</h2>
          <div className={styles.barChart}>
            {byCategory.map(cat => (
              <div key={cat.name} className={styles.barRow}>
                <div className={styles.barLabel}>{cat.name}</div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(cat.units / maxUnits) * 100}%` }}
                  />
                </div>
                <div className={styles.barValue}>{cat.units}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>⚠ Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <div className={styles.empty}>All items are well stocked ✓</div>
          ) : (
            <div className={styles.alertList}>
              {lowStock.map(item => (
                <button key={item.id} className={styles.alertItem} onClick={() => onSelectItem(item)}>
                  <div className={styles.alertLeft}>
                    <div className={styles.alertName}>{item.name}</div>
                    <div className={styles.alertSku}>{item.sku} · {item.category}</div>
                  </div>
                  <div className={styles.alertRight}>
                    <span className={`${styles.badge} ${item.stock === 0 ? styles.badgeRed : styles.badgeYellow}`}>
                      {item.stock === 0 ? 'OUT' : item.stock}
                    </span>
                    <div className={styles.alertMin}>min {item.minStock}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Category Summary</h2>
        <div className={styles.catTable}>
          <div className={styles.catHeader}>
            <span>Category</span>
            <span>SKUs</span>
            <span>Units</span>
            <span>Value</span>
          </div>
          {byCategory.map(cat => (
            <div key={cat.name} className={styles.catRow}>
              <span>{cat.name}</span>
              <span>{cat.count}</span>
              <span>{cat.units.toLocaleString()}</span>
              <span>${cat.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
