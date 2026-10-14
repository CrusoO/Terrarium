import React, { useMemo } from "react";
import styles from "./StatsBar.module.css";
import { Briefcase, Clock, CheckCircle, AlertTriangle, PauseCircle } from "lucide-react";

export default function StatsBar({ jobs, overdue }) {
  const counts = useMemo(() => {
    const c = { Pending: 0, "In Progress": 0, Completed: 0, "On Hold": 0, Cancelled: 0 };
    jobs.forEach((j) => { if (c[j.status] !== undefined) c[j.status]++; });
    return c;
  }, [jobs]);

  const stats = [
    { label: "Total Jobs", value: jobs.length, icon: <Briefcase size={20} />, color: "var(--accent)" },
    { label: "In Progress", value: counts["In Progress"], icon: <Clock size={20} />, color: "var(--info)" },
    { label: "Completed", value: counts["Completed"], icon: <CheckCircle size={20} />, color: "var(--success)" },
    { label: "On Hold", value: counts["On Hold"], icon: <PauseCircle size={20} />, color: "var(--warning)" },
    { label: "Overdue", value: overdue.length, icon: <AlertTriangle size={20} />, color: "var(--danger)", highlight: overdue.length > 0 },
  ];

  return (
    <div className={styles.bar}>
      {stats.map((s) => (
        <div key={s.label} className={`${styles.card} ${s.highlight ? styles.highlight : ""}`}>
          <div className={styles.icon} style={{ color: s.color, background: `${s.color}18` }}>
            {s.icon}
          </div>
          <div>
            <div className={styles.value} style={{ color: s.highlight ? s.color : "var(--text)" }}>
              {s.value}
            </div>
            <div className={styles.label}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
