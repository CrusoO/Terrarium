import React from 'react'
import { priorityColor, statusColor, formatDate } from '../utils'
import styles from './TicketRow.module.css'

export default function TicketRow({ ticket, selected, onClick }) {
  return (
    <div
      className={`${styles.row} ${selected ? styles.selected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className={styles.top}>
        <span className={styles.id}>#{ticket.id}</span>
        <span className={styles.priority} style={{ color: priorityColor(ticket.priority) }}>
          {ticket.priority}
        </span>
      </div>
      <p className={styles.title}>{ticket.title}</p>
      <div className={styles.meta}>
        <span className={styles.badge} style={statusColor(ticket.status)}>{ticket.status}</span>
        <span className={styles.category}>{ticket.category}</span>
        <span className={styles.time}>{formatDate(ticket.updated)}</span>
      </div>
      <p className={styles.requester}>✉ {ticket.requester}</p>
    </div>
  )
}
