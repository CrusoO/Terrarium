import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import styles from './ProductDetailPage.module.css';

function StarRating({ rating, reviews }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width="18" height="18" viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className={styles.ratingNum}>{rating}</span>
      <span className={styles.reviewCount}>({reviews.toLocaleString()} reviews)</span>
    </div>
  );
}

export default function ProductDetailPage({ product, onBack, onCartOpen }) {
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = items.find(i => i.id === product.id);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to catalogue
        </button>

        <div className={styles.layout}>
          <div className={styles.imageSection}>
            <div className={styles.imageWrap}>
              <img src={product.image} alt={product.name} className={styles.image} />
              {product.badge && (
                <span className={`${styles.badge} ${styles[`badge_${product.badge.replace(/\s+/g, '_').toLowerCase()}`]}`}>
                  {product.badge}
                </span>
              )}
              {discount && (
                <span className={styles.discount}>-{discount}% OFF</span>
              )}
            </div>
          </div>

          <div className={styles.infoSection}>
            <span className={styles.category}>{product.category}</span>
            <h1 className={styles.name}>{product.name}</h1>
            <StarRating rating={product.rating} reviews={product.reviews} />

            <div className={styles.priceRow}>
              <span className={styles.price}>${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <>
                  <span className={styles.originalPrice}>${product.originalPrice.toFixed(2)}</span>
                  <span className={styles.saveBadge}>Save ${(product.originalPrice - product.price).toFixed(2)}</span>
                </>
              )}
            </div>

            <p className={styles.description}>{product.description}</p>

            <div className={styles.features}>
              <h3 className={styles.featuresTitle}>Key Features</h3>
              <ul className={styles.featureList}>
                {product.features.map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.stockRow}>
              <div className={`${styles.stockIndicator} ${product.stock < 20 ? styles.lowStock : styles.inStock}`}>
                <span className={styles.stockDot}></span>
                {product.stock < 20 ? `Only ${product.stock} left` : 'In Stock'}
              </div>
            </div>

            <div className={styles.actions}>
              <div className={styles.qtyControl}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <span className={styles.qtyNum}>{qty}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              <button
                className={`${styles.addToCartBtn} ${added ? styles.addedState : ''}`}
                onClick={handleAdd}
              >
                {added ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    Add to Cart · ${(product.price * qty).toFixed(2)}
                  </>
                )}
              </button>
            </div>

            {inCart && (
              <button className={styles.viewCartBtn} onClick={onCartOpen}>
                View Cart ({inCart.quantity} in cart)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
