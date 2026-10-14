import React, { useState } from 'react'
import { GRADES, STATUSES } from '../data/students'
import StatusBadge from './StatusBadge'
import styles from './StudentDetail.module.css'

export default function StudentDetail({ student, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...student })
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'gpa' ? parseFloat(value) || 0 : value }))
  }

  function handleSave() {
    onUpdate(form)
    setEditing(false)
  }

  function handleCancel() {
    setForm({ ...student })
    setEditing(false)
  }

  const gpaColor = student.gpa >= 3.5 ? 'high' : student.gpa >= 2.5 ? 'mid' : 'low'

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Student Detail</h2>
        <div className={styles.headerActions}>
          {!editing && (
            <button className={styles.editBtn} onClick={() => setEditing(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {/* Profile hero */}
        <div className={styles.hero}>
          <div className={styles.heroAvatar} data-status={student.status}>
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div className={styles.heroInfo}>
            <h3 className={styles.heroName}>{student.firstName} {student.lastName}</h3>
            <p className={styles.heroEmail}>{student.email}</p>
            <div className={styles.heroBadges}>
              <StatusBadge status={student.status} />
              <span className={styles.gradeChip}>{student.grade} Grade</span>
            </div>
          </div>
          <div className={`${styles.gpaCircle} ${styles[`gpa_${gpaColor}`]}`}>
            <span className={styles.gpaVal}>{student.gpa.toFixed(1)}</span>
            <span className={styles.gpaLabel}>GPA</span>
          </div>
        </div>

        {editing ? (
          <div className={styles.editForm}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>First Name</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Last Name</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input name="email" value={form.email} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Grade</label>
                <select name="grade" value={form.grade} onChange={handleChange}>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>GPA</label>
                <input name="gpa" type="number" step="0.1" min="0" max="4" value={form.gpa} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange} />
              </div>
            </div>
            <div className={styles.field}>
              <label>Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
            </div>
            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        ) : (
          <div className={styles.details}>
            <Section title="Contact Information">
              <InfoRow icon="📧" label="Email" value={student.email} />
              <InfoRow icon="📞" label="Phone" value={student.phone} />
              <InfoRow icon="🏠" label="Address" value={student.address} />
            </Section>

            <Section title="Academic Information">
              <InfoRow icon="🎓" label="Grade" value={`${student.grade} Grade`} />
              <InfoRow icon="📊" label="GPA" value={student.gpa.toFixed(2)} />
              <InfoRow icon="📋" label="Status" value={<StatusBadge status={student.status} />} />
            </Section>

            {student.notes && (
              <Section title="Notes">
                <p className={styles.notes}>{student.notes}</p>
              </Section>
            )}

            <div className={styles.dangerZone}>
              {!confirmDelete ? (
                <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                  Remove Student
                </button>
              ) : (
                <div className={styles.confirmDelete}>
                  <p>Remove <strong>{student.firstName} {student.lastName}</strong> from the roster?</p>
                  <div className={styles.confirmActions}>
                    <button className={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
                    <button className={styles.confirmBtn} onClick={() => onDelete(student.id)}>Yes, Remove</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoIcon}>{icon}</span>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}
