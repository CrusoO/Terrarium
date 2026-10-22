import React, { useState } from 'react'
import { ITEMS_CATALOG } from '../data/seed'
import { formatCurrency } from '../utils/format'
import styles from './CreateOrder.module.css'

export default function CreateOrder({ onClose, onSubmit }) {
  const [customer, setCustomer] = useState('')
  const [note, setNote] = useState('')
  const [cart, setCart] = useState([])
  const [errors, setErrors] = useState({})

  const addItem = (item) => {
    setCart(prev => {
      const ex = prev.find(x => x.id === item.id)
      if (ex) return prev.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const removeItem = (id) => setCart(prev => prev.filter(x => x.id !== id))

  const updateQty = (id, qty) => {
    if (qty < 1) { removeItem(id); return }
    setCart(prev => prev.map(x => x.id === id ? { ...x, qty } : x))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const validate = () => {
    const e = {}
    if (!customer.trim()) e.customer = 'Customer name is required'
    if (cart.length === 0) e.cart = 'Add at least one item'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      customer: customer.trim(),
      items: cart,
      total: +total.toFixed(2),
      status: 'Pending',
      note: note.trim(),
    })
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Order</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            <div className={styles.left}>
              <div className={styles.field}>
                <label className={styles.label}>Customer Name *</label>
                <input
                  className={`${styles.input} ${errors.customer ? styles.inputError : ''}`}
                  type="text"
                  placeholder="Enter customer name"
                  value={customer}
                  onChange={e => { setCustomer(e.target.value); setErrors(p => ({ ...p, customer: '' })) }}
                />
                {errors.customer && <span className={styles.error}>{errors.customer}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Note (optional)</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Any special instructions…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Menu Items</label>
                {errors.cart && <span className={styles.error}>{errors.cart}</span>}
                <div className={styles.catalog}>
                  {ITEMS_CATALOG.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.catalogItem}
                      onClick={() => addItem(item)}
                    >
                      <span className={styles.catalogName}>{item.name}</span>
                      <span className={styles.catalogPrice}>{formatCurrency(item.price)}</span>
                      <span className={styles.addIcon}>+</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.right}>
              <div className={styles.cartHeader}>
                <span className={styles.label}>Cart</span>
                <span className={styles.cartCount}>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
              </div>

              {cart.length === 0 ? (
                <div className={styles.cartEmpty}>
                  <span>🛒</span>
                  <p>No items added yet</p>
                </div>
              ) : (
                <div className={styles.cartItems}>
                  {cart.map(item => (
                    <div key={item.id} className={styles.cartItem}>
                      <div className={styles.cartItemInfo}>
                        <span className={styles.cartItemName}>{item.name}</span>
                        <span className={styles.cartItemPrice}>{formatCurrency(item.price)}</span>
                      </div>
                      <div className={styles.cartItemControls}>
                        <button type="button" className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                        <span className={styles.qty}>{item.qty}</span>
                        <button type="button" className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                        <span className={styles.cartItemTotal}>{formatCurrency(item.price * item.qty)}</span>
                        <button type="button" className={styles.removeBtn} onClick={() => removeItem(item.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.cartTotals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Tax (8%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Create Order</button>
          </div>
        </form>
      </div>
    </div>
  )
}
