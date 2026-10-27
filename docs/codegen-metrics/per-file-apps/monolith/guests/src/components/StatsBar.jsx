import React from "react";
import styles from "./StatsBar.module.css";

const FILTERS = [
  { key: "all", label: "All", color: "var(--accent2)" },
  { key: "yes", label: "Attending", color: "var(--yes)" },
  { key: "maybe", label: "Maybe", color: "var(--maybe)" },
  { key: "no", label: "Declined", color: "var(--no)" },
  { key: "pending", label: "Pending", color: "var(--pending)" },
];

export default function StatsBar({ stats, activeFilter, onFilter }) {
  return (
    <div className={styles.bar}>
      {FILTERS.map((f) => {
        const count = f.key === "all" ? stats.total : stats[f.key];
        const active = activeFilter === f.key;
        return (
          <button
            key={f.key}
            className={`${styles.chip} ${active ? styles.active : ""}`}
            style={{ "--chip-color": f.color }}
            onClick={() => onFilter(f.key)}
          >
            <span className={styles.dot} />
            <span className={styles.chipLabel}>{f.label}</span>
            <span className={styles.count}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
