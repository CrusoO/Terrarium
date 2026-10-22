import type { Job } from "../types";
import StatusBadge from "./StatusBadge";

type JobCardProps = {
  item: Job;
  onSelect: (id: string) => void;
};

export default function JobCard({ item, onSelect }: JobCardProps) {
  return (
    <div className="entity-card" onClick={() => onSelect(item.id)}>
      <h3>{item.title}</h3>
      <p>Owner: {item.owner}</p>
      <p>Due: {item.dueDate}</p>
      <StatusBadge status={item.status} />
    </div>
  );
}
