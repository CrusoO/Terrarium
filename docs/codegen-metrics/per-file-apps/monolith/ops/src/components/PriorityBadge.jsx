import React from "react";
import styles from "./PriorityBadge.module.css";

const CONFIG = {
  "Low":      { color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  "Medium":   { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "High":     { color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  "Critical": { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const ICONS = { Low: "↓", Medium: "→", High: "↑", Critical: "⚡" };

export default function PriorityBadge({ priority }) {
  const cfg = CONFIG[priority] || CONFIG["Low"];
  return (
    <span
      className={styles.badge}
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}40` }}
    >
      <span>{ICONS[priority] || "·"}</span>
      {priority}
    </span>
  );
}
