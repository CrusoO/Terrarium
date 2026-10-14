import React, { useState } from "react";
import styles from "./GuestDetail.module.css";
import { rsvpMeta, RSVP_OPTIONS } from "../utils/rsvp";

export default function GuestDetail({ guest, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...guest });
  const meta = rsvpMeta(guest.rsvp);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSave() {
    onUpdate(form);
    setEditing(false);
  }

  function handleCancel() {
    setForm({ ...guest });
    setEditing(false);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Guest Details</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.hero}>
          <div className={styles.bigAvatar}>{guest.avatar}</div>
          {!editing ? (
            <>
              <h3 className={styles.heroName}>{guest.name}</h3>
              <span className={styles.heroBadge} style={{ "--rsvp-color": meta.color }}>
                {meta.icon} {meta.label}
              </span>
            </>
          ) : (
            <input
              className={styles.editInput}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
            />
          )}
        </div>

        <div className={styles.fields}>
          <Field label="Email" icon="✉️">
            {editing
              ? <input className={styles.editInput} name="email" value={form.email} onChange={handleChange} />
              : <span>{guest.email}</span>}
          </Field>
          <Field label="Phone" icon="📞">
            {editing
              ? <input className={styles.editInput} name="phone" value={form.phone} onChange={handleChange} />
              : <span>{guest.phone}</span>}
          </Field>
          <Field label="RSVP Status" icon="📋">
            {editing
              ? (
                <select className={styles.editSelect} name="rsvp" value={form.rsvp} onChange={handleChange}>
                  {RSVP_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              )
              : <span style={{ color: meta.color }}>{meta.icon} {meta.label}</span>}
          </Field>
          <Field label="Meal Preference" icon="🍽">
            {editing
              ? <input className={styles.editInput} name="meal" value={form.meal} onChange={handleChange} />
              : <span>{guest.meal}</span>}
          </Field>
          <Field label="Table" icon="🪑">
            {editing
              ? <input className={styles.editInput} name="table" type="number" value={form.table || ""} onChange={handleChange} placeholder="—" />
              : <span>{guest.table ? `Table ${guest.table}` : "—"}</span>}
          </Field>
          <Field label="Notes" icon="📝">
            {editing
              ? <textarea className={styles.editTextarea} name="notes" value={form.notes} onChange={handleChange} rows={3} />
              : <span className={styles.notes}>{guest.notes || "—"}</span>}
          </Field>
        </div>

        <div className={styles.actions}>
          {editing ? (
            <>
              <button className={styles.saveBtn} onClick={handleSave}>Save Changes</button>
              <button className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <>
              <button className={styles.editBtn} onClick={() => setEditing(true)}>✏️ Edit</button>
              <button className={styles.deleteBtn} onClick={() => onDelete(guest.id)}>🗑 Remove</button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{icon} {label}</span>
      <div className={styles.fieldValue}>{children}</div>
    </div>
  );
}
