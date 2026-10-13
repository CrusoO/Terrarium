import React from "react";
import GuestCard from "./GuestCard";
import styles from "./GuestGrid.module.css";

export default function GuestGrid({ guests, onSelect, selectedId }) {
  return (
    <div className={styles.grid}>
      {guests.map((g) => (
        <GuestCard
          key={g.id}
          guest={g}
          selected={g.id === selectedId}
          onClick={() => onSelect(g)}
        />
      ))}
    </div>
  );
}
