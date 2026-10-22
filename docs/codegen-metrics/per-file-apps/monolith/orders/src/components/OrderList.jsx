import React from 'react'
import { formatCurrency, formatDate } from '../utils/format'
import styles from './OrderList.module.css'

const STATUS_COLORS = {
  Pending: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  Paid: { bg: 'var(--success-light)', color: 'var(--success)' },
  Refunded: { bg: '#e0e7ff', color: '#4338ca' },
  Cancelled: { bg: 'var(--danger-light)', color: 'var(--danger)' },
}

export default function OrderList({ orders, selectedId, onSelect }) {
  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <span>🔎</span>
        <p>No orders match your search.</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      <div className={styles.count}>{orders.length} order{orders.length !== 1 ? 's' : ''}</div>
      {orders.map(order => {
        const sc = STATUS_COLORS[order.status] || {}
        return (
          <button
            key={order.id}
            className={`${styles.card} ${selectedId === order.id ? styles.selected : ''}`}
            onClick={() => onSelect(order.id)}
          >
            <div className={styles.cardTop}>
              <span className={styles.orderId}>{order.id}</span>
              <span className={styles.badge} style={{ background: sc.bg, color: sc.color }}>
                {order.status}
              </span>
            </div>
            <div className={styles.customer}>{order.customer}</div>
            <div className={styles.cardBottom}>
              <span className={styles.date}>{formatDate(order.createdAt)}</span>
              <span className={styles.total}>{formatCurrency(order.total)}</span>
            </div>
            <div className={styles.itemPreview}>
              {order.items.slice(0, 3).map(i => `${i.name} ×${i.qty}`).join(' · ')}
              {order.items.length > 3 && ' · …'}
            </div>
          </button>
        )
      })}
    </div>
  )
}
