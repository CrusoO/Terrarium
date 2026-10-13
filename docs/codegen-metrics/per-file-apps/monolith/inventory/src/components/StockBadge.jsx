import styles from './StockBadge.module.css';

export default function StockBadge({ quantity, minStock }) {
  const ratio = minStock > 0 ? quantity / minStock : 1;

  let level, label;
  if (quantity === 0) {
    level = 'out';
    label = 'Out of Stock';
  } else if (ratio <= 1) {
    level = 'low';
    label = 'Low Stock';
  } else if (ratio <= 2) {
    level = 'medium';
    label = 'Medium';
  } else {
    level = 'good';
    label = 'In Stock';
  }

  return (
    <span className={`${styles.badge} ${styles[level]}`}>
      <span className={styles.dot} />
      {label}
    </span>
  );
}
