import React, { useState } from 'react'
import styles from './AddExpenseModal.module.css'

const today = () => new Date().toISOString().split('T')[0]

export default function AddExpenseModal({ categories, staff, onAdd, onClose }) {
  const [form, setForm] = useState({
    staff: staff[0],
    category: categories[0].id,
    description: '',
    amount: '',
    date: today(),
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Enter a valid amount'
    if (!form.date) e.date = 'Date is required'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onAdd({ ...form, amount: parseFloat(form.amount) })
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <span>➕</span> Add Expense
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Staff Member</label>
              <select className={styles.input} value={form.staff} onChange={e => set('staff', e.target.value)}>
                {staff.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date</label>
              <input
                className={`${styles.input} ${errors.date ? styles.inputErr : ''}`}
                type="date"
                value={form.date}
                max={today()}
                onChange={e => { set('date', e.target.value); setErrors(er => ({ ...er, date: '' })) }}
              />
              {errors.date && <span className={styles.err}>{errors.date}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <div className={styles.catGrid}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.catOption} ${form.category === cat.id ? styles.catSelected : ''}`}
                  style={{ '--c': cat.color, '--bg': cat.bg }}
                  onClick={() => set('category', cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <input
              className={`${styles.input} ${errors.description ? styles.inputErr : ''}`}
              type="text"
              placeholder="What was this expense for?"
              value={form.description}
              onChange={e => { set('description', e.target.value); setErrors(er => ({ ...er, description: '' })) }}
            />
            {errors.description && <span className={styles.err}>{errors.description}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Amount (USD)</label>
            <div className={styles.amountWrap}>
              <span className={styles.dollar}>$</span>
              <input
                className={`${styles.input} ${styles.amountInput} ${errors.amount ? styles.inputErr : ''}`}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => { set('amount', e.target.value); setErrors(er => ({ ...er, amount: '' })) }}
              />
            </div>
            {errors.amount && <span className={styles.err}>{errors.amount}</span>}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Add Expense</button>
          </div>
        </form>
      </div>
    </div>
  )
}
