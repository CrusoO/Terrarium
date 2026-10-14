import React from "react";
import styles from "./FilterBar.module.css";
import { STATUSES, PRIORITIES, CATEGORIES } from "../data/jobs";

export default function FilterBar({
  statusFilter, setStatusFilter,
  priorityFilter, setPriorityFilter,
  categoryFilter, setCategoryFilter,
}) {
  return (
    <div className={styles.bar}>
      <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", ...STATUSES]} />
      <Select label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={["All", ...PRIORITIES]} />
      <Select label="Category" value={categoryFilter} onChange={setCategoryFilter} options={["All", ...CATEGORIES]} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className={styles.selectWrap}>
      <label className={styles.label}>{label}</label>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
