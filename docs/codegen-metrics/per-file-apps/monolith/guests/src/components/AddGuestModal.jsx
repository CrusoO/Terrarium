import React, { useState } from "react";
import styles from "./AddGuestModal.module.css";
import { RSVP_OPTIONS } from "../utils/rsvp";

const EMPTY = {
  name: "", email: "", phone: "", rsvp: "pending",
  meal: "Standard", table: "", notes: "",
};

export default function AddGuestModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onAdd({ ...form, table: form.table ? Number(form.table) : null });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add New Guest</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <FormField label="Full Name *" error={errors.name}>
            <input
              className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              name="name" value={form.name} onChange={handleChange}
              placeholder="Jane Doe"
            />
          </FormField>

          <FormField label="Email *" error={errors.email}>
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="jane@example.com"
            />
          </FormField>

          <FormField label="Phone">
            <input
              className={styles.input}
              name="phone" value={form.phone} onChange={handleChange}
              placeholder="+1 555-0000"
            />
          </FormField>

          <div className={styles.row}>
            <FormField label="RSVP Status">
              <select className={styles.input} name="rsvp" value={form.rsvp} onChange={handleChange}>
                {RSVP_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Table #">
              <input
                className={styles.input}
                name="table" type="number" value={form.table} onChange={handleChange}
                placeholder="—" min="1"
              />
            </FormField>
          </div>

          <FormField label="Meal Preference">
            <select className={styles.input} name="meal" value={form.meal} onChange={handleChange}>
              {["Standard", "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Notes">
            <textarea
              className={styles.input}
              name="notes" value={form.notes} onChange={handleChange}
              placeholder="Any special requirements…"
              rows={3}
              style={{ resize: "vertical" }}
            />
          </FormField>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Add Guest</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: "0.75rem", color: "var(--no)" }}>{error}</span>}
    </div>
  );
}
