import React, { useState } from "react";
import { format, parseISO, isPast } from "date-fns";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import styles from "./JobTable.module.css";
import { ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";

const COLS = [
  { key: "id", label: "Job ID" },
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "assignee", label: "Assignee" },
  { key: "due", label: "Due Date" },
];

export default function JobTable({ jobs, navigate }) {
  const [sort, setSort] = useState({ key: "due", dir: "asc" });

  const toggleSort = (key) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  };

  const sorted = [...jobs].sort((a, b) => {
    let av = a[sort.key] ?? "";
    let bv = b[sort.key] ?? "";
    if (sort.key === "due" || sort.key === "created") {
      av = new Date(av);
      bv = new Date(bv);
    } else {
      av = av.toString().toLowerCase();
      bv = bv.toString().toLowerCase();
    }
    if (av < bv) return sort.dir === "asc" ? -1 : 1;
    if (av > bv) return sort.dir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLS.map((c) => (
              <th key={c.key} onClick={() => toggleSort(c.key)} className={styles.th}>
                <span className={styles.thInner}>
                  {c.label}
                  <span className={styles.sortIcon}>
                    {sort.key === c.key
                      ? sort.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      : <ChevronDown size={13} className={styles.sortFade} />}
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={COLS.length} className={styles.empty}>
                No jobs match your filters.
              </td>
            </tr>
          )}
          {sorted.map((job) => {
            const overdue =
              job.status !== "Completed" &&
              job.status !== "Cancelled" &&
              isPast(parseISO(job.due));
            return (
              <tr
                key={job.id}
                className={`${styles.row} ${overdue ? styles.overdueRow : ""}`}
                onClick={() => navigate("detail", { jobId: job.id })}
              >
                <td className={styles.td}>
                  <span className={styles.jobId}>{job.id}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.jobTitle}>{job.title}</span>
                  {overdue && (
                    <span className={styles.overdueTag}>
                      <AlertTriangle size={11} /> Overdue
                    </span>
                  )}
                </td>
                <td className={styles.td}>
                  <span className={styles.category}>{job.category}</span>
                </td>
                <td className={styles.td}>
                  <StatusBadge status={job.status} />
                </td>
                <td className={styles.td}>
                  <PriorityBadge priority={job.priority} />
                </td>
                <td className={styles.td}>
                  <span className={styles.assignee}>{job.assignee}</span>
                </td>
                <td className={styles.td}>
                  <span className={overdue ? styles.dueDateOverdue : styles.dueDate}>
                    {format(parseISO(job.due), "MMM d, yyyy")}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
