import React, { useState } from "react";
import { format, parseISO, isPast } from "date-fns";
import useStore from "../store/useStore";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import styles from "./JobDetail.module.css";
import { ArrowLeft, Trash2, Save, AlertTriangle } from "lucide-react";
import { STATUSES, PRIORITIES, ASSIGNEES } from "../data/jobs";

export default function JobDetail({ jobId, navigate }) {
  const job = useStore((s) => s.getJob(jobId));
  const updateJob = useStore((s) => s.updateJob);
  const deleteJob = useStore((s) => s.deleteJob);

  const [form, setForm] = useState(job ? { ...job } : null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!job || !form) {
    return (
      <div className={styles.notFound}>
        <p>Job not found.</p>
        <button onClick={() => navigate("dashboard")}>← Back</button>
      </div>
    );
  }

  const isOverdue =
    form.status !== "Completed" &&
    form.status !== "Cancelled" &&
    isPast(parseISO(form.due));

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    updateJob(jobId, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    deleteJob(jobId);
    navigate("dashboard");
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate("dashboard")}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className={styles.topActions}>
          {saved && <span className={styles.savedMsg}>✓ Saved</span>}
          <button className={styles.saveBtn} onClick={handleSave}>
            <Save size={15} /> Save Changes
          </button>
          <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {isOverdue && (
        <div className={styles.overdueBanner}>
          <AlertTriangle size={16} />
          This job is <strong>overdue</strong>. Due date was{" "}
          {format(parseISO(form.due), "MMM d, yyyy")}.
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.jobId}>{form.id}</span>
            <input
              className={styles.titleInput}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className={styles.badges}>
            <StatusBadge status={form.status} />
            <PriorityBadge priority={form.priority} />
          </div>
        </div>

        <div className={styles.grid}>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Assignee">
            <select value={form.assignee} onChange={(e) => set("assignee", e.target.value)}>
              {ASSIGNEES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <input value={form.category} onChange={(e) => set("category", e.target.value)} />
          </Field>
          <Field label="Due Date">
            <input
              type="date"
              value={form.due.slice(0, 10)}
              onChange={(e) => set("due", new Date(e.target.value).toISOString())}
            />
          </Field>
          <Field label="Created">
            <input value={format(parseISO(form.created), "MMM d, yyyy HH:mm")} readOnly />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>

        <Field label="Notes / Updates">
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Add internal notes or status updates…"
          />
        </Field>
      </div>

      {confirmDelete && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <h3>Delete Job?</h3>
            <p>This will permanently remove <strong>{form.id}</strong>. This cannot be undone.</p>
            <div className={styles.dialogActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}
