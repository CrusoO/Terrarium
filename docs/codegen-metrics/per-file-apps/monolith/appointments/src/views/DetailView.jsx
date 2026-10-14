import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import { STATUSES, STATUS_COLOR, PROVIDERS, VISIT_TYPES } from '../data/seed'
import { format, parseISO } from 'date-fns'
import StatusBadge from '../components/StatusBadge'
import styles from './DetailView.module.css'

export default function DetailView({ id, onBack }) {
  const visits = useStore(s => s.visits)
  const updateVisit = useStore(s => s.updateVisit)
  const deleteVisit = useStore(s => s.deleteVisit)

  const visit = visits.find(v => v.id === id)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!visit) return (
    <div className={styles.notFound}>
      <p>Visit not found.</p>
      <button onClick={onBack}>← Back</button>
    </div>
  )

  const startEdit = () => {
    setForm({
      patientName: visit.patientName,
      patientDob: visit.patientDob,
      patientPhone: visit.patientPhone,
      patientEmail: visit.patientEmail,
      providerId: visit.providerId,
      visitType: visit.visitType,
      status: visit.status,
      dateTime: visit.dateTime.slice(0, 16),
      duration: visit.duration,
      notes: visit.notes,
    })
    setEditing(true)
  }

  const cancelEdit = () => { setEditing(false); setForm(null) }

  const saveEdit = () => {
    const provider = PROVIDERS.find(p => p.id === form.providerId)
    updateVisit({
      ...visit,
      ...form,
      providerName: provider.name,
      providerSpecialty: provider.specialty,
      dateTime: new Date(form.dateTime).toISOString(),
      duration: Number(form.duration),
    })
    setEditing(false)
    setForm(null)
  }

  const handleDelete = () => {
    deleteVisit(id)
    onBack()
  }

  const f = form || {}

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <button className={styles.backBtn} onClick={onBack}>← All Visits</button>
        <span className={styles.sep}>/</span>
        <span className={styles.crumb}>{visit.patientName}</span>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>{visit.patientName.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
            <div>
              <h1 className={styles.patientName}>{visit.patientName}</h1>
              <p className={styles.subLine}>
                DOB: {visit.patientDob} &nbsp;·&nbsp; {visit.visitType}
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <StatusBadge status={visit.status} large />
            {!editing && (
              <div className={styles.headerActions}>
                <button className={styles.editBtn} onClick={startEdit}>✏️ Edit</button>
                <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>🗑️ Delete</button>
              </div>
            )}
          </div>
        </div>

        {editing ? (
          <EditForm form={f} setForm={setForm} onSave={saveEdit} onCancel={cancelEdit} />
        ) : (
          <ReadView visit={visit} />
        )}
      </div>

      {confirmDelete && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <h3>Delete this visit?</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.dialogActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReadView({ visit }) {
  return (
    <div className={styles.sections}>
      <Section title="Appointment">
        <Field label="Date & Time" value={format(parseISO(visit.dateTime), 'EEEE, MMMM d, yyyy · h:mm a')} />
        <Field label="Duration" value={`${visit.duration} minutes`} />
        <Field label="Visit Type" value={visit.visitType} />
        <Field label="Status" value={<StatusBadge status={visit.status} />} />
      </Section>
      <Section title="Provider">
        <Field label="Name" value={visit.providerName} />
        <Field label="Specialty" value={visit.providerSpecialty} />
      </Section>
      <Section title="Patient">
        <Field label="Name" value={visit.patientName} />
        <Field label="Date of Birth" value={visit.patientDob} />
        <Field label="Phone" value={visit.patientPhone} />
        <Field label="Email" value={visit.patientEmail} />
      </Section>
      <Section title="Notes">
        <p className={styles.notes}>{visit.notes || <em style={{color:'var(--text-muted)'}}>No notes recorded.</em>}</p>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.fields}>{children}</div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  )
}

function EditForm({ form, setForm, onSave, onCancel }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className={styles.editForm}>
      <div className={styles.formGrid}>
        <label className={styles.formGroup}>
          <span>Patient Name</span>
          <input value={form.patientName || ''} onChange={e => set('patientName', e.target.value)} />
        </label>
        <label className={styles.formGroup}>
          <span>Date of Birth</span>
          <input type="date" value={form.patientDob || ''} onChange={e => set('patientDob', e.target.value)} />
        </label>
        <label className={styles.formGroup}>
          <span>Phone</span>
          <input value={form.patientPhone || ''} onChange={e => set('patientPhone', e.target.value)} />
        </label>
        <label className={styles.formGroup}>
          <span>Email</span>
          <input type="email" value={form.patientEmail || ''} onChange={e => set('patientEmail', e.target.value)} />
        </label>
        <label className={styles.formGroup}>
          <span>Provider</span>
          <select value={form.providerId || ''} onChange={e => set('providerId', e.target.value)}>
            {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className={styles.formGroup}>
          <span>Visit Type</span>
          <select value={form.visitType || ''} onChange={e => set('visitType', e.target.value)}>
            {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className={styles.formGroup}>
          <span>Status</span>
          <select value={form.status || ''} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className={styles.formGroup}>
          <span>Date & Time</span>
          <input type="datetime-local" value={form.dateTime || ''} onChange={e => set('dateTime', e.target.value)} />
        </label>
        <label className={styles.formGroup}>
          <span>Duration (min)</span>
          <input type="number" min="5" max="240" step="5" value={form.duration || 30} onChange={e => set('duration', e.target.value)} />
        </label>
      </div>
      <label className={styles.formGroup} style={{marginTop: 4}}>
        <span>Notes</span>
        <textarea rows={4} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
      </label>
      <div className={styles.editActions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.saveBtn} onClick={onSave}>Save Changes</button>
      </div>
    </div>
  )
}
