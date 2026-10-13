import React from "react";
import styles from "./Toolbar.module.css";

export default function Toolbar({ search, onSearch, onAdd, count }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.input}
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clear} onClick={() => onSearch("")}>✕</button>
        )}
      </div>
      <div className={styles.right}>
        <span className={styles.countLabel}>{count} guest{count !== 1 ? "s" : ""}</span>
        <button className={styles.addBtn} onClick={onAdd}>
          <span>＋</span> Add Guest
        </button>
      </div>
    </div>
  );
}
