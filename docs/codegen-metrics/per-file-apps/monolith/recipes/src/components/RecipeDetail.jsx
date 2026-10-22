import React, { useEffect } from 'react';
import styles from './RecipeDetail.module.css';

export default function RecipeDetail({ recipe, onClose }) {
  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={recipe.title}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>

        <div className={styles.hero}>
          {recipe.image
            ? <img src={recipe.image} alt={recipe.title} className={styles.heroImg} />
            : <div className={styles.heroPlaceholder}>🍴</div>
          }
          <div className={styles.heroOverlay}>
            <span className={styles.course}>{recipe.course}</span>
            <h1 className={styles.title}>{recipe.title}</h1>
            <div className={styles.heroMeta}>
              <span>⏱ {recipe.time} min</span>
              <span>👤 {recipe.servings} servings</span>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>{recipe.description}</p>

          <div className={styles.columns}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>🥄 Ingredients</h2>
              <ul className={styles.ingredientList}>
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className={styles.ingredient}>
                    <span className={styles.bullet} />
                    {ing}
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>📋 Instructions</h2>
              <ol className={styles.stepList}>
                {recipe.steps.map((step, i) => (
                  <li key={i} className={styles.step}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
