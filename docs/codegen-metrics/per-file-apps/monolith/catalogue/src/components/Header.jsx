import React from 'react';
import { useCart } from '../context/CartContext';
import styles from './Header.module.css';

export default function Header({ onCartClick }) {
  const { totalItems } = useCart();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>ShopCatalogue</span>
        </div>
        <button className={styles.cartBtn} onClick={onCartClick} aria-label="Open cart">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {totalItems > 0 && (
            <span className={styles.badge}>{totalItems > 99 ? '99+' : totalItems}</span>
          )}
        </button>
      </div>
    </header>
  );
}
