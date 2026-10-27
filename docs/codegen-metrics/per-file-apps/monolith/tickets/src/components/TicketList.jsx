import React, { useState, useMemo } from 'react'
import { STATUSES } from '../data/tickets'
import TicketRow from './TicketRow'
import styles from './TicketList.module.css'

const ALL = 'All'
const STATUS_TABS = [ALL, ...STATUSES]

export default function TicketList({ tickets, selectedId, onSelect }) {
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState(ALL)

  const counts = useMemo(() => {
    const c = { All: tickets.length }
    STATUSES.forEach(s => { c[s] = tickets.filter(t => t.status === s).length })
    return c
  }, [tickets])

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = activeStatus === ALL || t.status === activeStatus
      const q = search.toLowerCase()
      const matchSearch = !q ||
        t.title.toLowerCase().includes(q) ||
        t.requester.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        t.category.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [tickets, search, activeStatus])

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <h2 className={styles.heading}>Tickets</h2>
        <span className={styles.total}>{tickets.length} total</span>
      </div>

      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.search}
          type="text"
          placeholder="Search by title, requester, ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      <div className={styles.tabs}>
        {STATUS_TABS.map(s => (
          <button
            key={s}
            className={`${styles.tab} ${activeStatus === s ? styles.tabActive : ''}`}
            onClick={() => setActiveStatus(s)}
          >
            {s}
            <span className={styles.tabCount}>{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.noResults}>
            <span>😶</span>
            <p>No tickets match your filters.</p>
          </div>
        ) : (
          filtered.map(t => (
            <TicketRow
              key={t.id}
              ticket={t}
              selected={t.id === selectedId}
              onClick={() => onSelect(t.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
