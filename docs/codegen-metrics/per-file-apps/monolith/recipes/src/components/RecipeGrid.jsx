import React from 'react';
import RecipeCard from './RecipeCard';
import styles from './RecipeGrid.module.css';

export default function RecipeGrid({ recipes, onSelect }) {
  if (recipes.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🍽️</span>
        <p>No recipes found. Try a different search or add your own!</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {recipes.map(r => (
        <RecipeCard key={r.id} recipe={r} onClick={() => onSelect(r)} />
      ))}
    </div>
  );
}
