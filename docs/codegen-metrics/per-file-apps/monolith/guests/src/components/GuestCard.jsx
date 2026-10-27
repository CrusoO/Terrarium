import React from "react";
import styles from "./GuestCard.module.css";
import { rsvpMeta } from "../utils/rsvp";

export default function GuestCard({ guest, selected, onClick }) {
  const meta = rsvpMeta(guest.rsvp);
  return (
    <button
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={onClick}
      style={{ "--rsvp-color": meta.color }}
    >
      <div className={styles.top}>
        <div className={styles.avatar}>{guest.avatar}</div>
        <div className={styles.info}>
          <p className={styles.name}>{guest.name}</p>
          <p className={styles.email}>{guest.email}</p>
        </div>
        <span className={styles.badge}>{meta.icon} {meta.label}</span>
      </div>
      <div className={styles.bottom}>
        <span className={styles.detail}>🍽 {guest.meal}</span>
        {guest.table && <span className={styles.detail}>🪑 Table {guest.table}</span>}
        {guest.notes && <span className={styles.note} title={guest.notes}>📝 {guest.notes}</span>}
      </div>
    </button>
  );
}
