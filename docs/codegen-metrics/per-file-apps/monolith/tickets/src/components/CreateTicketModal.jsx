import React, { useState } from 'react'
import { STATUSES, PRIORITIES, CATEGORIES } from '../data/tickets'
import styles from './CreateTicketModal.module.css'

export default function CreateTicketModal({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    title: '',
    requester: '',
    category: CATEGORIES[0],
    priority: 'Medium',
    status: 'Open',
    description: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.requester.trim()) e.requester = 'Requester email is required'
    else if (!/\S+@\S+\.\S+/.test(form.requester)) e.requester = 'Enter a valid email'
    if (!form.description.trim()) e.description = 'Description is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    onSubmit(form)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Ticket</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Title <span className={styles.req}>*</span></label>
            <input
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Brief summary of the issue"
            />
            {errors.title && <span className={styles.error}>{errors.title}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Requester Email <span className={styles.req}>*</span></label>
            <input
              className={`${styles.input} ${errors.requester ? styles.inputError : ''}`}
              type="email"
              value={form.requester}
              onChange={e => set('requester', e.target.value)}
              placeholder="customer@example.com"
            />
            {errors.requester && <span className={styles.error}>{errors.requester}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <select className={styles.select} value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description <span className={styles.req}>*</span></label>
            <textarea
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              rows={5}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the issue in detail…"
            />
            {errors.description && <span className={styles.error}>{errors.description}</span>}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Create Ticket</button>
          </div>
        </form>
      </div>
    </div>
  )
}
