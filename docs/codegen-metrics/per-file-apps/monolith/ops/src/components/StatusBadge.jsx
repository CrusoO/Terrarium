import React from "react";
import styles from "./StatusBadge.module.css";

const CONFIG = {
  "Pending":     { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "In Progress": { color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  "On Hold":     { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "Completed":   { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  "Cancelled":   { color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { color: "#6b7280", bg: "rgba(107,114,128,0.12)" };
  return (
    <span
      className={styles.badge}
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}40` }}
    >
      <span className={styles.dot} style={{ background: cfg.color }} />
      {status}
    </span>
  );
}
