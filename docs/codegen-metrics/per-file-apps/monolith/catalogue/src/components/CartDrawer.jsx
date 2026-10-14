import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import styles from './CartDrawer.module.css';

export default function CartDrawer({ open, onClose }) {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />
      <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`} aria-label="Shopping cart">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <h2 className={styles.title}>Your Cart</h2>
            {items.length > 0 && (
              <span className={styles.itemCount}>{items.reduce((s, i) => s + i.quantity, 0)}</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🛍️</div>
            <h3>Your cart is empty</h3>
            <p>Add some products to get started!</p>
            <button className={styles.continueBtn} onClick={onClose}>Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className={styles.itemList}>
              {items.map(item => (
                <CartItem key={item.id} item={item} onRemove={removeItem} onUpdateQty={updateQty} />
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <span className={styles.subtotalPrice}>${totalPrice.toFixed(2)}</span>
              </div>
              <div className={styles.shipping}>
                <span>Shipping</span>
                <span className={styles.freeShipping}>
                  {totalPrice >= 50 ? 'FREE
<<<FILE path="src/pages/CartPage.jsx">>>
import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import styles from "./CartPage.module.css";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } =
    useContext(CartContext);

  if (cartItems.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/" className={styles.shopBtn}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your Cart</h1>
      <div className={styles.layout}>
        <div className={styles.items}>
          {cartItems.map((item) => (
            <div key={item.id} className={styles.card}>
              <img
                src={item.image}
                alt={item.name}
                className={styles.image}
              />
              <div className={styles.info}>
                <h3 className={styles.name}>{item.name}</h3>
                <p className={styles.category}>{item.category}</p>
                <p className={styles.price}>${item.price.toFixed(2)}</p>
              </div>
              <div className={styles.controls}>
                <div className={styles.qty}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1)
                    }
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <p className={styles.subtotal}>
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Remove item"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Order Summary</h2>
          <div className={styles.summaryRow}>
            <span>Items ({cartItems.reduce((a, i) => a + i.quantity, 0)})</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span className={styles.free}>Free</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <button className={styles.checkoutBtn}>Proceed to Checkout</button>
          <button className={styles.clearBtn} onClick={clearCart}>
            Clear Cart
          </button>
          <Link to="/" className={styles.continueLink}>
            ← Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
