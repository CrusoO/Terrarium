import React from 'react'
import styles from './AppShell.module.css'

export default function AppShell({ children, onNew }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.icon}>📅</span>
          <span className={styles.title}>AppointmentBook</span>
        </div>
        <button className={styles.newBtn} onClick={onNew}>
          + New Visit
        </button>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
