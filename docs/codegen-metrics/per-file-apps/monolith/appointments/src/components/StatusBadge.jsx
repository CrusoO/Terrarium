import React from 'react'
import { STATUS_COLOR } from '../data/seed'
import styles from './StatusBadge.module.css'

export default function StatusBadge({ status, large }) {
  const colors = STATUS_COLOR[status] || { bg: '#f1f5f9', text: '#475569' }
  return (
    <span
      className={`${styles.badge} ${large ? styles.large : ''}`}
      style={{ background: colors.bg, color: colors.text }}
    >
      {status}
    </span>
  )
}
