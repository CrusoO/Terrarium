import React from 'react';
import styles from './RecipeCard.module.css';

export default function RecipeCard({ recipe, onClick }) {
  return (
    <article className={styles.card} onClick={onClick} tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className={styles.imgWrap}>
        {recipe.image
          ? <img src={recipe.image} alt={recipe.title} className={styles.img} />
          : <div className={styles.placeholder}>🍴</div>
        }
        <span className={styles.course}>{recipe.course}</span>
      </div>
      <div className={styles.body}>
        <h2 className={styles.title}>{recipe.title}</h2>
        <p className={styles.desc}>{recipe.description}</p>
        <div className={styles.meta}>
          <span>⏱ {recipe.time} min</span>
          <span>👤 {recipe.servings} servings</span>
          <span className={styles.ingredients}>🥄 {recipe.ingredients.length} ingredients</span>
        </div>
      </div>
    </article>
  );
}
