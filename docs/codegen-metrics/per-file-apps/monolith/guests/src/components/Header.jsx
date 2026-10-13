import React from "react";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>🎉</span>
          <div>
            <h1 className={styles.title}>GuestList</h1>
            <p className={styles.sub}>Summer Gala 2025 · June 21</p>
          </div>
        </div>
      </div>
    </header>
  );
}
