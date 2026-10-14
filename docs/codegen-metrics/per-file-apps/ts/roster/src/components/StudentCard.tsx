import React from "react";
import type { Student } from "../types";
import StatusBadge from "./StatusBadge";

interface StudentCardProps {
  item: Student;
  onSelect: (id: string) => void;
}

export default function StudentCard({ item, onSelect }: StudentCardProps) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div>
        <strong>{item.name}</strong>
        <div>Homeroom {item.homeroom}</div>
        <div>Guardian: {item.guardian}</div>
      </div>
      <StatusBadge status={item.status} />
    </button>
  );
}
