import React, { useState, useEffect } from 'react';
import { COURSES } from '../data/recipes';
import styles from './AddRecipeModal.module.css';

const EMPTY = {
  title: '', course: 'Main', time: '', servings: '',
  description: '', image: '',
  ingredientsRaw: '', stepsRaw: '',
};

export default function AddRecipeModal({ onAdd, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.time || isNaN(form.time) || +form.time <= 0) e.time = 'Enter a valid time.';
    if (!form.servings || isNaN(form.servings) || +form.servings <= 0) e.servings = 'Enter valid servings.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.ingredientsRaw.trim()) e.ingredientsRaw = 'Add at least one ingredient.';
    if (!form.stepsRaw.trim()) e.stepsRaw = 'Add at least one step.';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onAdd({
      title: form.title.trim(),
      course: form.course,
      time: +form.time,
      servings: +form.servings,
      description: form.description.trim(),
      image: form.image.trim() || null,
      ingredients: form.ingredientsRaw.split('\n').map(s => s.trim()).filter(Boolean),
      steps: form.stepsRaw.split('\n').map(s => s.trim()).filter(Boolean),
    });
  }

  const courses = COURSES.filter(c => c !== 'All');

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Add Recipe">
        <div className={styles.header}>
          <h2 className={styles.heading}>Add New Recipe</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <Field label="Recipe Title *" error={errors.title}>
              <input
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Grandma's Apple Pie"
              />
            </Field>
            <Field label="Course *">
              <select className={styles.input} value={form.course} onChange={e => set('course', e.target.value)}>
                {courses.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className={styles.row}>
            <Field label="Cook Time (min) *" error={errors.time}>
              <input
                className={`${styles.input} ${errors.time ? styles.inputError : ''}`}
                type="number" min="1"
                value={form.time}
                onChange={e => set('time', e.target.value)}
                placeholder="30"
              />
            </Field>
            <Field label="Servings *" error={errors.servings}>
              <input
                className={`${styles.input} ${errors.servings ? styles.inputError : ''}`}
                type="number" min="1"
                value={form.servings}
                onChange={e => set('servings', e.target.value)}
                placeholder="4"
              />
            </Field>
          </div>

          <Field label="Description *" error={errors.description}>
            <textarea
              className={`${styles.input} ${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              rows={2}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="A short description of the dish…"
            />
          </Field>

          <Field label="Image URL (optional)">
            <input
              className={styles.input}
              value={form.image}
              onChange={e => set('image', e.target.value)}
              placeholder="https://…"
            />
          </Field>

          <div className={styles.row}>
            <Field label="Ingredients * (one per line)" error={errors.ingredientsRaw}>
              <textarea
                className={`${styles.input} ${styles.textarea} ${errors.ingredientsRaw ? styles.inputError : ''}`}
                rows={5}
                value={form.ingredientsRaw}
                onChange={e => set('ingredientsRaw', e.target.value)}
                placeholder={"2 cups flour\n1 tsp salt\n…"}
              />
            </Field>
            <Field label="Steps * (one per line)" error={errors.stepsRaw}>
              <textarea
                className={`${styles.input} ${styles.textarea} ${errors.stepsRaw ? styles.inputError : ''}`}
                rows={5}
                value={form.stepsRaw}
                onChange={e => set('stepsRaw', e.target.value)}
                placeholder={"Preheat oven to 180°C.\nMix dry ingredients.\n…"}
              />
            </Field>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Save Recipe</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{error}</span>}
    </div>
  );
}
