import React from 'react'
import { formatCurrency, formatDay, dayKey } from '../utils/format'
import styles from './DailyTotals.module.css'

const STATUS_COLORS = {
  Pending: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  Paid: { bg: 'var(--success-light)', color: 'var(--success)' },
  Refunded: { bg: '#e0e7ff', color: '#4338ca' },
  Cancelled: { bg: 'var(--danger-light)', color: 'var(--danger)' },
}

export default function DailyTotals({ orders }) {
  const grouped = {}
  orders.forEach(o => {
    const key = dayKey(o.createdAt)
    if (!grouped[key]) grouped[key] = { ts: o.createdAt, orders: [] }
    grouped[key].orders.push(o)
  })

  const days = Object.entries(grouped)
    .sort((a, b) => b[1].ts - a[1].ts)
    .map(([key, { ts, orders: dayOrders }]) => {
      const revenue = dayOrders.reduce((s, o) => s + o.total, 0)
      const paid = dayOrders.filter(o => o.status === 'Paid').reduce((s, o) => s + o.total, 0)
      const pending = dayOrders.filter(o => o.status === 'Pending').reduce((s, o) => s + o.total, 0)
      const refunded = dayOrders.filter(o => o.status === 'Refunded').reduce((s, o) => s + o.total, 0)
      const cancelled = dayOrders.filter(o => o.status === 'Cancelled').reduce((s, o) => s + o.total, 0)
      const statusCounts = {}
      dayOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })
      return { key, ts, dayOrders, revenue, paid, pending, refunded, cancelled, statusCounts }
    })

  const grandTotal = days.reduce((s, d) => s + d.revenue, 0)
  const grandPaid = days.reduce((s, d) => s + d.paid, 0)
  const grandOrders = orders.length

  return (
    <div className={styles.container}>
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Revenue</div>
          <div className={styles.summaryValue}>{formatCurrency(grandTotal)}</div>
          <div className={styles.summaryNote}>{grandOrders} orders total</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryGreen}`}>
          <div className={styles.summaryLabel}>Paid Revenue</div>
          <div className={styles.summaryValue}>{formatCurrency(grandPaid)}</div>
          <div className={styles.summaryNote}>{orders.filter(o => o.status === 'Paid').length} paid orders</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryYellow}`}>
          <div className={styles.summaryLabel}>Pending</div>
          <div className={styles.summaryValue}>{formatCurrency(days.reduce((s, d) => s + d.pending, 0))}</div>
          <div className={styles.summaryNote}>{orders.filter(o => o.status === 'Pending').length} pending orders</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryRed}`}>
          <div className={styles.summaryLabel}>Refunded</div>
          <div className={styles.summaryValue}>{formatCurrency(days.reduce((s, d) => s + d.refunded, 0))}</div>
          <div className={styles.summaryNote}>{orders.filter(o => o.status === 'Refunded').length} refunded</div>
        </div>
      </div>

      <div className={styles.days}>
        {days.map(day => (
          <div key={day.key} className={styles.dayCard}>
            <div className={styles.dayHeader}>
              <div>
                <div className={styles.dayLabel}>{formatDay(day.ts)}</div>
                <div className={styles.dayMeta}>{day.dayOrders.length} order{day.dayOrders.length !== 1 ? 's' : ''}</div>
              </div>
              <div className={styles.dayRevenue}>{formatCurrency(day.revenue)}</div>
            </div>

            <div className={styles.dayStats}>
              {Object.entries(day.statusCounts).map(([status, count]) => {
                const sc = STATUS_COLORS[status] || {}
                return (
                  <span key={status} className={styles.statusChip} style={{ background: sc.bg, color: sc.color }}>
                    {status}: {count}
                  </span>
                )
              })}
            </div>

            <div className={styles.barGroup}>
              {day.paid > 0 && (
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>Paid</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${(day.paid / day.revenue) * 100}%`,
                        background: 'var(--success)',
                      }}
                    />
                  </div>
                  <span className={styles.barValue}>{formatCurrency(day.paid)}</span>
                </div>
              )}
              {day.pending > 0 && (
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>Pending</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${(day.pending / day.revenue) * 100}%`,
                        background: 'var(--warning)',
                      }}
                    />
                  </div>
                  <span className={styles.barValue}>{formatCurrency(day.pending)}</span>
                </div>
              )}
              {day.refunded > 0 && (
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>Refunded</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${(day.refunded / day.revenue) * 100}%`,
                        background: '#818cf8',
                      }}
                    />
                  </div>
                  <span className={styles.barValue}>{formatCurrency(day.refunded)}</span>
                </div>
              )}
              {day.cancelled > 0 && (
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>Cancelled</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${(day.cancelled / day.revenue) * 100}%`,
                        background: 'var(--danger)',
                      }}
                    />
                  </div>
                  <span className={styles.barValue}>{formatCurrency(day.cancelled)}</span>
                </div>
              )}
            </div>

            <div className={styles.orderList}>
              {day.dayOrders.map(o => {
                const sc = STATUS_COLORS[o.status] || {}
                return (
                  <div key={o.id} className={styles.orderRow}>
                    <span className={styles.orderRowId}>{o.id}</span>
                    <span className={styles.orderRowCustomer}>{o.customer}</span>
                    <span className={styles.orderRowBadge} style={{ background: sc.bg, color: sc.color }}>
                      {o.status}
                    </span>
                    <span className={styles.orderRowTotal}>{formatCurrency(o.total)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
<<<FILE path="src/components/DailyTotals.jsx">>>
import { useMemo } from "react";
import useStore from "../store/useStore";
import { formatCurrency } from "../utils/format";
import styles from "./DailyTotals.module.css";

export default function DailyTotals() {
  const orders = useStore((s) => s.orders);

  const dailyData = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      const date = order.createdAt.slice(0, 10);
      if (!map[date]) {
        map[date] = { date, total: 0, count: 0, paid: 0, unpaid: 0, partial: 0 };
      }
      map[date].total += order.total;
      map[date].count += 1;
      if (order.paymentStatus === "paid") map[date].paid += 1;
      else if (order.paymentStatus === "unpaid") map[date].unpaid += 1;
      else if (order.paymentStatus === "partial") map[date].partial += 1;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders]);

  const grandTotal = useMemo(
    () => dailyData.reduce((sum, d) => sum + d.total, 0),
    [dailyData]
  );

  if (dailyData.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No orders to display.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Grand Total</span>
          <span className={styles.summaryValue}>{formatCurrency(grandTotal)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Orders</span>
          <span className={styles.summaryValue}>
            {dailyData.reduce((s, d) => s + d.count, 0)}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Days Tracked</span>
          <span className={styles.summaryValue}>{dailyData.length}</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders</th>
              <th className={styles.right}>Daily Total</th>
              <th className={styles.center}>Paid</th>
              <th className={styles.center}>Partial</th>
              <th className={styles.center}>Unpaid</th>
              <th className={styles.right}>Avg Order</th>
            </tr>
          </thead>
          <tbody>
            {dailyData.map((row) => (
              <tr key={row.date} className={styles.row}>
                <td className={styles.date}>
                  {new Date(row.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className={styles.center}>{row.count}</td>
                <td className={`${styles.right} ${styles.total}`}>
                  {formatCurrency(row.total)}
                </td>
                <td className={styles.center}>
                  {row.paid > 0 ? (
                    <span className={`${styles.badge} ${styles.paid}`}>{row.paid}</span>
                  ) : (
                    <span className={styles.zero}>—</span>
                  )}
                </td>
                <td className={styles.center}>
                  {row.partial > 0 ? (
                    <span className={`${styles.badge} ${styles.partial}`}>{row.partial}</span>
                  ) : (
                    <span className={styles.zero}>—</span>
                  )}
                </td>
                <td className={styles.center}>
                  {row.unpaid > 0 ? (
                    <span className={`${styles.badge} ${styles.unpaid}`}>{row.unpaid}</span>
                  ) : (
                    <span className={styles.zero}>—</span>
                  )}
                </td>
                <td className={styles.right}>
                  {formatCurrency(row.total / row.count)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.footRow}>
              <td>
                <strong>Total</strong>
              </td>
              <td className={styles.center}>
                <strong>{dailyData.reduce((s, d) => s + d.count, 0)}</strong>
              </td>
              <td className={`${styles.right} ${styles.total}`}>
                <strong>{formatCurrency(grandTotal)}</strong>
              </td>
              <td className={styles.center}>
                <strong>{dailyData.reduce((s, d) => s + d.paid, 0)}</strong>
              </td>
              <td className={styles.center}>
                <strong>{dailyData.reduce((s, d) => s + d.partial, 0)}</strong>
              </td>
              <td className={styles.center}>
                <strong>{dailyData.reduce((s, d) => s + d.unpaid, 0)}</strong>
              </td>
              <td className={styles.right}>—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
