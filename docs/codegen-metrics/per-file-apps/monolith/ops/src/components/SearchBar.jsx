import React from "react";
import styles from "./SearchBar.module.css";
import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <div className={styles.wrap}>
      <Search size={15} className={styles.icon} />
      <input
        className={styles.input}
        placeholder="Search by title, ID, or assignee…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className={styles.clear} onClick={() => onChange("")}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
