import React, { useState } from 'react'
import { STATUSES } from '../data/seed'
import { formatCurrency, formatDate } from '../utils/format'
import styles from './OrderDetail.module.css'

const STATUS_COLORS = {
  Pending: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  Paid: { bg: 'var(--success-light)', color: 'var(--success)' },
  Refunded: { bg: '#e0e7ff', color: '#4338ca' },
  Cancelled: { bg: 'var(--danger-light)', color: 'var(--danger)' },
}

export default function OrderDetail({ order, onClose, onStatusChange }) {
  const [changing, setChanging] = useState(false)
  const sc = STATUS_COLORS[order.status] || {}
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <div>
          <div className={styles.detailId}>{order.id}</div>
          <div className={styles.detailDate}>{formatDate(order.createdAt)}</div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} title="Close">✕</button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Customer</div>
        <div className={styles.customerName}>{order.customer}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Payment Status</div>
        <div className={styles.statusRow}>
          <span className={styles.badge} style={{ background: sc.bg, color: sc.color }}>
            {order.status}
          </span>
          <button className={styles.changeBtn} onClick={() => setChanging(v => !v)}>
            {changing ? 'Cancel' : 'Change'}
          </button>
        </div>
        {changing && (
          <div className={styles.statusOptions}>
            {STATUSES.filter(s => s !== order.status).map(s => {
              const c = STATUS_COLORS[s] || {}
              return (
                <button
                  key={s}
                  className={styles.statusOption}
                  style={{ background: c.bg, color: c.color }}
                  onClick={() => { onStatusChange(order.id, s); setChanging(false) }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Order Items</div>
        <div className={styles.itemsTable}>
          <div className={styles.tableHead}>
            <span>Item</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Total</span>
          </div>
          {order.items.map((item, i) => (
            <div key={i} className={styles.tableRow}>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemQty}>{item.qty}</span>
              <span>{formatCurrency(item.price)}</span>
              <span className={styles.itemTotal}>{formatCurrency(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.totalsBox}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Tax (8%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {order.note && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Note</div>
          <div className={styles.note}>{order.note}</div>
        </div>
      )}
    </div>
  )
}
