import React from 'react'
import styles from './StatusBadge.module.css'

export default function StatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
