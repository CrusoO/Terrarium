import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { STATUSES, STATUS_COLOR } from '../data/seed'
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'
import StatusBadge from '../components/StatusBadge'
import styles from './ListView.module.css'

const ALL = 'All'

function friendlyDate(iso) {
  const d = parseISO(iso)
  const time = format(d, 'h:mm a')
  if (isToday(d)) return `Today, ${time}`
  if (isTomorrow(d)) return `Tomorrow, ${time}`
  if (isYesterday(d)) return `Yesterday, ${time}`
  return format(d, 'MMM d, yyyy · h:mm a')
}

export default function ListView({ onSelect, onNew }) {
  const visits = useStore(s => s.visits)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [sort, setSort] = useState('dateAsc')

  const filtered = useMemo(() => {
    let list = [...visits]
    if (statusFilter !== ALL) list = list.filter(v => v.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(v =>
        v.patientName.toLowerCase().includes(q) ||
        v.providerName.toLowerCase().includes(q) ||
        v.visitType.toLowerCase().includes(q) ||
        v.patientPhone.includes(q)
      )
    }
    list.sort((a, b) => {
      if (sort === 'dateAsc')  return new Date(a.dateTime) - new Date(b.dateTime)
      if (sort === 'dateDesc') return new Date(b.dateTime) - new Date(a.dateTime)
      if (sort === 'patient')  return a.patientName.localeCompare(b.patientName)
      if (sort === 'provider') return a.providerName.localeCompare(b.providerName)
      return 0
    })
    return list
  }, [visits, search, statusFilter, sort])

  const counts = useMemo(() => {
    const c = { All: visits.length }
    STATUSES.forEach(s => { c[s] = visits.filter(v => v.status === s).length })
    return c
  }, [visits])

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.search}
            placeholder="Search patient, provider, visit type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="dateAsc">Date ↑</option>
          <option value="dateDesc">Date ↓</option>
          <option value="patient">Patient A–Z</option>
          <option value="provider">Provider A–Z</option>
        </select>
      </div>

      <div className={styles.filterRow}>
        {[ALL, ...STATUSES].map(s => (
          <button
            key={s}
            className={`${styles.filterChip} ${statusFilter === s ? styles.active : ''}`}
            style={statusFilter === s && s !== ALL ? {
              background: STATUS_COLOR[s]?.bg,
              color: STATUS_COLOR[s]?.text,
              borderColor: STATUS_COLOR[s]?.text + '55',
            } : {}}
            onClick={() => setStatusFilter(s)}
          >
            {s}
            <span className={styles.chipCount}>{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className={styles.resultMeta}>
        {filtered.length} visit{filtered.length !== 1 ? 's' : ''}
        {statusFilter !== ALL && ` · ${statusFilter}`}
        {search && ` · "${search}"`}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🗓️</div>
          <p>No visits found</p>
          <button className={styles.emptyBtn} onClick={onNew}>Create a visit</button>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(v => (
            <button key={v.id} className={styles.card} onClick={() => onSelect(v.id)}>
              <div className={styles.cardLeft}>
                <div className={styles.dateBlock}>
                  <span className={styles.dateDay}>{format(parseISO(v.dateTime), 'd')}</span>
                  <span className={styles.dateMon}>{format(parseISO(v.dateTime), 'MMM')}</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <span className={styles.patientName}>{v.patientName}</span>
                  <StatusBadge status={v.status} />
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.metaItem}>🕐 {friendlyDate(v.dateTime)}</span>
                  <span className={styles.metaItem}>👨‍⚕️ {v.providerName}</span>
                  <span className={styles.metaItem}>📋 {v.visitType}</span>
                </div>
                {v.notes && <p className={styles.cardNotes}>{v.notes}</p>}
              </div>
              <span className={styles.chevron}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
