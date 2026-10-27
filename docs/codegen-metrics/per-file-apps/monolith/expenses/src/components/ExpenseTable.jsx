import React, { useState } from 'react'
import styles from './ExpenseTable.module.css'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className={styles.sortNeutral}>⇅</span>
  return <span className={styles.sortActive}>{sortDir === 'asc' ? '↑' : '↓'}</span>
}

export default function ExpenseTable({ expenses, categories, filteredTotal, onDelete, sortField, sortDir, onSort }) {
  const [confirmId, setConfirmId] = useState(null)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const handleDelete = (id) => {
    if (confirmId === id) {
      onDelete(id)
      setConfirmId(null)
    } else {
      setConfirmId(id)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableHead}>
        <div className={styles.tableTitle}>
          Expenses
          <span className={styles.count}>{expenses.length} record{expenses.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.filteredTotal}>
          Showing: <strong>{fmt(filteredTotal)}</strong>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <div className={styles.emptyText}>No expenses match your filters</div>
          <div className={styles.emptySub}>Try adjusting your search or filters</div>
        </div>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} onClick={() => onSort('date')}>
                  Date <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className={styles.th} onClick={() => onSort('staff')}>
                  Staff <SortIcon field="staff" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className={styles.th} onClick={() => onSort('category')}>
                  Category <SortIcon field="category" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className={styles.th} onClick={() => onSort('description')}>
                  Description <SortIcon field="description" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className={`${styles.th} ${styles.right}`} onClick={() => onSort('amount')}>
                  Amount <SortIcon field="amount" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, i) => {
                const cat = catMap[exp.category]
                return (
                  <tr key={exp.id} className={`${styles.row} ${i % 2 === 1 ? styles.rowAlt : ''}`}>
                    <td className={styles.td}>
                      <span className={styles.date}>{fmtDate(exp.date)}</span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.staffCell}>
                        <div className={styles.avatar}>
                          {exp.staff.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </div>
                        <span className={styles.staffName}>{exp.staff}</span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {cat && (
                        <span className={styles.catBadge} style={{ '--c': cat.color, '--bg': cat.bg }}>
                          {cat.icon} {cat.label}
                        </span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.desc}>{exp.description}</span>
                    </td>
                    <td className={`${styles.td} ${styles.right}`}>
                      <span className={styles.amount}>{fmt(exp.amount)}</span>
                    </td>
                    <td className={`${styles.td} ${styles.actions}`}>
                      {confirmId === exp.id ? (
                        <div className={styles.confirmRow}>
                          <button className={styles.confirmYes} onClick={() => handleDelete(exp.id)}>Delete</button>
                          <button className={styles.confirmNo} onClick={() => setConfirmId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className={styles.deleteBtn} onClick={() => handleDelete(exp.id)} title="Delete">🗑</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className={styles.footRow}>
                <td colSpan={4} className={`${styles.td} ${styles.footLabel}`}>
                  Filtered Total ({expenses.length} items)
                </td>
                <td className={`${styles.td} ${styles.right} ${styles.footAmount}`}>
                  {fmt(filteredTotal)}
                </td>
                <td className={styles.td}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
