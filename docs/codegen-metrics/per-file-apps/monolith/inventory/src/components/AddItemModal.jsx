import React, { useState } from 'react'
import styles from './AddItemModal.module.css'
import { CATEGORIES } from '../data/initialItems'

const empty = { name: '', sku: '', category: CATEGORIES[0], stock: '', minStock: '', price: '', location: '', description: '' }

export default function AddItemModal({ onClose, onAdd }) {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.sku.trim()) e.sku = 'Required'
    if (form.stock === '' || isNaN(form.stock) || Number(form.stock) < 0) e.stock = 'Valid number required'
    if (form.minStock === '' || isNaN(form.minStock) || Number(form.minStock) < 0) e.minStock = 'Valid number required'
    if (form.price === '' || isNaN(form.price) || Number(form.price) < 0) e.price = 'Valid price required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd({
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category,
      stock: parseInt(form.stock),
      minStock: parseInt(form.minStock),
      price: parseFloat(form.price),
      location: form.location.trim() || 'Unassigned',
      description: form.description.trim(),
    })
  }

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add New Item</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Item Name *</label>
              <input className={`${styles.input} ${errors.name ? styles.err : ''}`} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Wireless Mouse" />
              {errors.name && <span className={styles.errMsg}>{errors.name}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>SKU *</label>
              <input className={`${styles.input} ${errors.sku ? styles.err : ''}`} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. EL-004" />
              {errors.sku && <span className={styles.errMsg}>{errors.sku}</span>}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select className={styles.input} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Location</label>
              <input className={styles.input} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Aisle A4" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Initial Stock *</label>
              <input className={`${styles.input} ${errors.stock ? styles.err : ''}`} type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
              {errors.stock && <span className={styles.errMsg}>{errors.stock}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Min Stock *</label>
              <input className={`${styles.input} ${errors.minStock ? styles.err : ''}`} type="number" min="0" value={form.minStock} onChange={e => set('minStock', e.target.value)} placeholder="0" />
              {errors.minStock && <span className={styles.errMsg}
<<<FILE path="src/components/AddItemModal.jsx">>>
import { useState } from 'react';
import styles from './AddItemModal.module.css';

const CATEGORIES = ['Electronics', 'Clothing', 'Food', 'Tools', 'Office', 'Other'];

export default function AddItemModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    quantity: '',
    minStock: '',
    price: '',
    location: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0)
      e.quantity = 'Valid quantity required';
    if (form.minStock === '' || isNaN(form.minStock) || Number(form.minStock) < 0)
      e.minStock = 'Valid min stock required';
    if (form.price === '' || isNaN(form.price) || Number(form.price) < 0)
      e.price = 'Valid price required';
    return e;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onAdd({
      id: Date.now(),
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category,
      quantity: Number(form.quantity),
      minStock: Number(form.minStock),
      price: parseFloat(form.price),
      location: form.location.trim() || 'Unassigned',
      description: form.description.trim() || 'No description provided.',
      lastUpdated: new Date().toISOString().split('T')[0],
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          change: Number(form.quantity),
          reason: 'Initial stock',
          user: 'Staff',
        },
      ],
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add New Item</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Item Name *</label>
              <input
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="e.g. Wireless Mouse"
              />
              {errors.name && <span className={styles.error}>{errors.name}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>SKU *</label>
              <input
                className={`${styles.input} ${errors.sku ? styles.inputError : ''}`}
                value={form.sku}
                onChange={e => handleChange('sku', e.target.value)}
                placeholder="e.g. WM-001"
              />
              {errors.sku && <span className={styles.error}>{errors.sku}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select
                className={styles.select}
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Location</label>
              <input
                className={styles.input}
                value={form.location}
                onChange={e => handleChange('location', e.target.value)}
                placeholder="e.g. Warehouse A"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Quantity *</label>
              <input
                className={`${styles.input} ${errors.quantity ? styles.inputError : ''}`}
                type="number"
                min="0"
                value={form.quantity}
                onChange={e => handleChange('quantity', e.target.value)}
                placeholder="0"
              />
              {errors.quantity && <span className={styles.error}>{errors.quantity}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Min Stock *</label>
              <input
                className={`${styles.input} ${errors.minStock ? styles.inputError : ''}`}
                type="number"
                min="0"
                value={form.minStock}
                onChange={e => handleChange('minStock', e.target.value)}
                placeholder="0"
              />
              {errors.minStock && <span className={styles.error}>{errors.minStock}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Unit Price ($) *</label>
              <input
                className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => handleChange('price', e.target.value)}
                placeholder="0.00"
              />
              {errors.price && <span className={styles.error}>{errors.price}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Optional item description..."
              rows={3}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Add Item</button>
          </div>
        </form>
      </div>
    </div>
  );
}
