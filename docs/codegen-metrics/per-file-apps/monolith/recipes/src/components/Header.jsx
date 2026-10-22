import React from 'react';
import styles from './Header.module.css';

export default function Header({ search, onSearch, onAdd }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>🍳</span>
          <span className={styles.title}>Recipe Box</span>
        </div>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.search}
            type="text"
            placeholder="Search recipes…"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clear} onClick={() => onSearch('')}>✕</button>
          )}
        </div>
        <button className={styles.addBtn} onClick={onAdd}>
          + Add Recipe
        </button>
      </div>
    </header>
  );
}
