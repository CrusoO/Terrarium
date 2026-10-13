import React from 'react';
import styles from './CategoryFilter.module.css';

const categoryIcons = {
  All: '✦',
  Electronics: '⚡',
  Clothing: '👕',
  'Home & Garden': '🏡',
  Sports: '🏃',
  Books: '📚',
  Beauty: '✨',
};

export default function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`${styles.chip} ${active === cat ? styles.active : ''}`}
            onClick={() => onChange(cat)}
          >
            <span className={styles.icon}>{categoryIcons[cat]}</span>
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
