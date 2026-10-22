import React from 'react'
import styles from './Totals.module.css'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export default function Totals({ totals, categories }) {
  return (
    <section className={styles.section}>
      <div className={styles.grand}>
        <div className={styles.grandLabel}>Total Expenses</div>
        <div className={styles.grandAmount}>{fmt(totals.grand)}</div>
        <div className={styles.grandSub}>{Object.keys(totals.byCategory).length} categories</div>
      </div>
      <div className={styles.cats}>
        {categories.map(cat => {
          const amt = totals.byCategory[cat.id] || 0
          const pct = totals.grand > 0 ? (amt / totals.grand) * 100 : 0
          return (
            <div key={cat.id} className={styles.catCard} style={{ '--cat-color': cat.color, '--cat-bg': cat.bg }}>
              <div className={styles.catTop}>
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </div>
              <div className={styles.catAmount}>{fmt(amt)}</div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${pct}%` }} />
              </div>
              <div className={styles.catPct}>{pct.toFixed(1)}%</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
