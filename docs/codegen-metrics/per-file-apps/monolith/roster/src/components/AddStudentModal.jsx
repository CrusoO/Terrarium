import React, { useState } from 'react'
import { GRADES, STATUSES } from '../data/students'
import styles from './AddStudentModal.module.css'

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '',
  grade: '9th', gpa: '', status: 'active', address: '', notes: ''
}

export default function AddStudentModal({ onAdd, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.gpa) e.gpa = 'Required'
    else if (isNaN(form.gpa) || +form.gpa < 0 || +form.gpa > 4) e.gpa = '0.0 – 4.0'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd({ ...form, gpa: parseFloat(form.gpa) })
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <div>
            <h2 className={styles.modalTitle}>Add New Student</h2>
            <p className={styles.modalSub}>Fill in the student's information below</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Personal Information</h3>
            <div className={styles.grid}>
              <Field label="First Name *" error={errors.firstName}>
                <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="e.g. Jane" className={errors.firstName ? styles.inputError : ''} />
              </Field>
              <Field label="Last Name *" error={errors.lastName}>
                <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="e.g. Smith" className={errors.lastName ? styles.inputError : ''} />
              </Field>
              <Field label="Email Address *" error={errors.email}>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane.smith@school.edu" className={errors.email ? styles.inputError : ''} />
              </Field>
              <Field label="Phone Number">
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="555-0100" />
              </Field>
              <Field label="Home Address" className={styles.fullWidth}>
                <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St" />
              </Field>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Academic Information</h3>
            <div className={styles.grid}>
              <Field label="Grade Level">
                <select name="grade" value={form.grade} onChange={handleChange}>
                  {GRADES.map(g => <option key={g} value={g}>{g} Grade</option>)}
                </select>
              </Field>
              <Field label="GPA *" error={errors.gpa}>
                <input name="gpa" type="number" step="0.1" min="0" max="4" value={form.gpa} onChange={handleChange} placeholder="0.0 – 4.0" className={errors.gpa ? styles.inputError : ''} />
              </Field>
              <Field label="Enrollment Status">
                <select name="status" value={form.status} onChange={handleChange}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any relevant notes about this student…"
              className={styles.textarea}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Student
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children, className }) {
  return (
    <div className={`${styles.field} ${className || ''}`}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
