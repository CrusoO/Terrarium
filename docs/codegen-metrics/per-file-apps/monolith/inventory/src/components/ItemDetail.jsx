import React, { useState } from 'react'
import styles from './ItemDetail.module.css'

function stockStatus(item) {
  if (item.stock === 0) return 'out'
  if (item.stock <= item.minStock) return 'low'
  return 'ok'
}

const statusLabel = { ok: 'In Stock', low: 'Low Stock', out: 'Out of Stock' }
const statusColor = { ok: 'green', low: 'yellow', out: 'red' }

export default function ItemDetail({ item, onClose, onUpdateStock }) {
  const [delta, setDelta] = useState('')
  const [note, setNote] = useState('')
  const [mode, setMode] = useState('add') // 'add' | 'remove'

  const status = stockStatus(item)

  const handleApply = () => {
    const num = parseInt(delta)
    if (!num || num <= 0) return
    const change = mode === 'add' ? num : -num
    onUpdateStock(item.id, change, note)
    setDelta('')
    setNote('')
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>{item.name}</h2>
            <div className={styles.panelSku}>{item.sku}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.stockHero}>
            <div className={`${styles.stockBig} ${styles[statusColor[status]]}`}>{item.stock}</div>
            <div className={styles.stockSub}>units in stock</div>
            <span className={`${styles.statusBadge} ${styles[status]}`}>{statusLabel[status]}</span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Category</div>
              <div className={styles.infoValue}>{item.category}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Price</div>
              <div className={styles.infoValue}>${item.price.toFixed(2)}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Min Stock</div>
              <div className={styles.infoValue}>{item.minStock}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Location</div>
              <div className={styles.infoValue}>{item.location}</div>
            </div>
            <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.infoLabel}>Stock Value</div>
              <div className={styles.infoValue}>${(item.stock * item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          {item.description && (
            <div className={styles.desc}>{item.description}</div>
          )}

          <div className={styles.adjustSection}>
            <h3 className={styles.sectionTitle}>Adjust Stock</h3>
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeBtn} ${mode === 'add' ? styles.modeActive : ''}`}
                onClick={() => setMode('add')}
              >+ Add</button>
              <button
                className={`${styles.modeBtn} ${mode === 'remove' ? styles.modeActiveRed : ''}`}
                onClick={() => setMode('remove')}
              >− Remove</button>
            </div>
            <div className={styles.adjustRow}>
              <input
                className={styles.deltaInput}
                type="number"
                min="1"
                placeholder="Quantity"
                value={delta}
                onChange={e => setDelta(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
              />
              <input
                className={styles.noteInput}
                type="text"
                placeholder="Note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
              />
              <button
                className={`${styles.applyBtn} ${mode === 'remove' ? styles.applyRed : ''}`}
                onClick={handleApply}
                disabled={!delta || parseInt(delta) <= 0}
              >
                Apply
              </button>
            </div>
          </div>

          <div className={styles.historySection}>
            <h3 className={styles.sectionTitle}>History</h3>
            <div className={styles.historyList}>
              {[...item.history].reverse().map((h, i) => (
                <div key={i} className={styles.historyRow}>
                  <div className={styles.historyDate}>{h.date}</div>
                  <div className={styles.historyNote}>{h.note}</div>
                  <div className={`${styles.historyChange} ${h.change > 0 ? styles.pos : styles.neg}`}>
                    {h.change > 0 ? '+' : ''}{h.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
