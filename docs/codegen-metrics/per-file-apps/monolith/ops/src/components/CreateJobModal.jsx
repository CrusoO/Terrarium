import React, { useState } from "react";
import useStore from "../store/useStore";
import { STATUSES, PRIORITIES, CATEGORIES, ASSIGNEES } from "../data/jobs";
import styles from "./CreateJobModal.module.css";
import { X } from "lucide-react";
import { addDays, format } from "date-fns";

const defaultDue = format(addDays(new Date(), 7), "yyyy-MM-dd");

const initial = {
  title: "",
  category: CATEGORIES[0],
  status: "Pending",
  priority: "Medium",
  assignee: ASSIGNEES[0],
  due: defaultDue,
  description: "",
};

export default function CreateJobModal({ onClose, navigate }) {
  const addJob = useStore((s) => s.addJob);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.due) e.due = "Due date is required.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const id = addJob({ ...form, due: new Date(form.due).toISOString() });
    onClose();
    navigate("detail", { jobId: id });
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Job</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Field label="Job Title *" error={errors.title}>
            <input
              placeholder="e.g. Replace HVAC filters in Building B"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              autoFocus
            />
          </Field>

          <div className={styles.row}>
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <div className={styles.row}>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Assignee">
              <select value={form.assignee} onChange={(e) => set("assignee", e.target.value)}>
                {ASSIGNEES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Due Date *" error={errors.due}>
            <input
              type="date"
              value={form.due}
              onChange={(e) => set("due", e.target.value)}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              placeholder="Describe the job scope and requirements…"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Create Job</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
