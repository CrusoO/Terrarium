import React from 'react'
import styles from './ItemList.module.css'

function stockStatus(item) {
  if (item.stock === 0) return 'out'
  if (item.stock <= item.minStock) return 'low'
  return 'ok'
}

export default function ItemList({ items, onSelect, selectedId }) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🔍</div>
        <div className={styles.emptyText}>No items match your search</div>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {items.map(item => {
        const status = stockStatus(item)
        const pct = Math.min(100, (item.stock / Math.max(item.minStock * 2, 1)) * 100)
        return (
          <button
            key={item.id}
            className={`${styles.card} ${selectedId === item.id ? styles.selected : ''}`}
            onClick={() => onSelect(item)}
          >
            <div className={styles.cardTop}>
              <div className={styles.cardLeft}>
                <div className={styles.name}>{item.name}</div>
                <div className={styles.meta}>{item.sku} · {item.category}</div>
              </div>
              <div className={`${styles.statusDot} ${styles[status]}`} title={status} />
            </div>

            <div className={styles.stockRow}>
              <div className={styles.stockNum}>
                <span className={`${styles.stockVal} ${status === 'out' ? styles.red : status === 'low' ? styles.yellow : styles.green}`}>
                  {item.stock}
                </span>
                <span className={styles.stockUnit}> units</span>
              </div>
              <div className={styles.minStock}>min {item.minStock}</div>
            </div>

            <div className={styles.barTrack}>
              <div
                className={`${styles.barFill} ${styles[status]}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className={styles.cardBottom}>
              <span className={styles.price}>${item.price.toFixed(2)}</span>
              <span className={styles.location}>📍 {item.location}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
