import React, { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { STATUSES, PROVIDERS, VISIT_TYPES } from '../data/seed'
import { useStore } from '../store/useStore'
import styles from './CreateModal.module.css'

const defaultForm = () => {
  const now = new Date()
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
  return {
    patientName: '',
    patientDob: '',
    patientPhone: '',
    patientEmail: '',
    providerId: PROVIDERS[0].id,
    visitType: VISIT_TYPES[0],
    status: 'Scheduled',
    dateTime: now.toISOString().slice(0, 16),
    duration: 30,
    notes: '',
  }
}

export default function CreateModal({ onClose, onCreated }) {
  const addVisit = useStore(s => s.addVisit)
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.patientName.trim()) e.patientName = 'Required'
    if (!form.dateTime) e.dateTime = 'Required'
    return e
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const provider = PROVIDERS.find(p => p.id === form.providerId)
    const visit = {
      id: uuid(),
      ...form,
      providerName: provider.name,
      providerSpecialty: provider.specialty,
      dateTime: new Date(form.dateTime).toISOString(),
      duration: Number(form.duration),
      createdAt: new Date().toISOString(),
    }
    addVisit(visit)
    onCreated(visit.id)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>New Visit</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Patient</h3>
            <div className={styles.grid}>
              <label className={styles.group}>
                <span>Full Name <em>*</em></span>
                <input
                  value={form.patientName}
                  onChange={e => set('patientName', e.target.value)}
                  placeholder="Jane Doe"
                  className={errors.patientName ? styles.error : ''}
                />
                {errors.patientName && <span className={styles.errMsg}>{errors.patientName}</span>}
              </label>
              <label className={styles.group}>
                <span>Date of Birth</span>
                <input type="date" value={form.patientDob} onChange={e => set('patientDob', e.target.value)} />
              </label>
              <label className={styles.group}>
                <span>Phone</span>
                <input value={form.patientPhone} onChange={e => set('patientPhone', e.target.value)} placeholder="555-0100" />
              </label>
              <label className={styles.group}>
                <span>Email</span>
                <input type="email" value={form.patientEmail} onChange={e => set('patientEmail', e.target.value)} placeholder="patient@example.com" />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Appointment</h3>
            <div className={styles.grid}>
              <label className={styles.group}>
                <span>Provider</span>
                <select value={form.providerId} onChange={e => set('providerId', e.target.value)}>
                  {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.specialty}</option>)}
                </select>
              </label>
              <label className={styles.group}>
                <span>Visit Type</span>
                <select value={form.visitType} onChange={e => set('visitType', e.target.value)}>
                  {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className={styles.group}>
                <span>Status</span>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className={styles.group}>
                <span>Date & Time <em>*</em></span>
                <input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={e => set('dateTime', e.target.value)}
                  className={errors.dateTime ? styles.error : ''}
                />
                {errors.dateTime && <span className={styles.errMsg}>{errors.dateTime}</span>}
              </label>
              <label className={styles.group}>
                <span>Duration (min)</span>
                <select value={form.duration} onChange={e => set('duration', e.target.value)}>
                  {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Optional notes…"
              className={styles.textarea}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Create Visit</button>
          </div>
        </form>
      </div>
    </div>
  )
}
