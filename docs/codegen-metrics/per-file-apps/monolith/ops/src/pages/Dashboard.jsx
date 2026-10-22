import React, { useState, useMemo } from "react";
import { isPast, parseISO } from "date-fns";
import useStore from "../store/useStore";
import StatsBar from "../components/StatsBar";
import JobTable from "../components/JobTable";
import CreateJobModal from "../components/CreateJobModal";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import styles from "./Dashboard.module.css";
import { Plus } from "lucide-react";

export default function Dashboard({ navigate }) {
  const jobs = useStore((s) => s.jobs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);

  const overdue = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.status !== "Completed" &&
          j.status !== "Cancelled" &&
          isPast(parseISO(j.due))
      ),
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j) => {
      const matchSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q) ||
        j.assignee.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || j.status === statusFilter;
      const matchPriority = priorityFilter === "All" || j.priority === priorityFilter;
      const matchCategory = categoryFilter === "All" || j.category === categoryFilter;
      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [jobs, search, statusFilter, priorityFilter, categoryFilter]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>⚙️</span>
          <div>
            <h1 className={styles.title}>Operations Dashboard</h1>
            <p className={styles.subtitle}>Supervisor View · {jobs.length} total jobs</p>
          </div>
        </div>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Job
        </button>
      </header>

      <StatsBar jobs={jobs} overdue={overdue} />

      <div className={styles.controls}>
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
          categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
        />
      </div>

      <div className={styles.tableWrap}>
        <JobTable jobs={filtered} navigate={navigate} />
      </div>

      {showCreate && (
        <CreateJobModal onClose={() => setShowCreate(false)} navigate={navigate} />
      )}
    </div>
  );
}
