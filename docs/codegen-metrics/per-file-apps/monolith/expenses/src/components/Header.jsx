import React from 'react'
import styles from './Header.module.css'

export default function Header({ onAdd }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>💰</span>
          <div>
            <h1 className={styles.title}>Expense Log</h1>
            <p className={styles.sub}>Track, manage and review team expenses</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={onAdd}>
          <span className={styles.plus}>+</span>
          Add Expense
        </button>
      </div>
    </header>
  )
}
