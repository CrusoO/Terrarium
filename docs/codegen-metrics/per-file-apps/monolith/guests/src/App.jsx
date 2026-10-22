import React, { useState, useMemo } from "react";
import { INITIAL_GUESTS } from "./data/guests";
import Header from "./components/Header";
import StatsBar from "./components/StatsBar";
import Toolbar from "./components/Toolbar";
import GuestGrid from "./components/GuestGrid";
import GuestDetail from "./components/GuestDetail";
import AddGuestModal from "./components/AddGuestModal";
import styles from "./App.module.css";

export default function App() {
  const [guests, setGuests] = useState(INITIAL_GUESTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || g.rsvp === filter;
      return matchSearch && matchFilter;
    });
  }, [guests, search, filter]);

  const stats = useMemo(() => ({
    total: guests.length,
    yes: guests.filter((g) => g.rsvp === "yes").length,
    no: guests.filter((g) => g.rsvp === "no").length,
    maybe: guests.filter((g) => g.rsvp === "maybe").length,
    pending: guests.filter((g) => g.rsvp === "pending").length,
  }), [guests]);

  function addGuest(data) {
    const newGuest = {
      ...data,
      id: Date.now(),
      avatar: data.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    };
    setGuests((prev) => [newGuest, ...prev]);
    setShowAdd(false);
  }

  function updateGuest(updated) {
    setGuests((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGuest(updated);
  }

  function deleteGuest(id) {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setSelectedGuest(null);
  }

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <StatsBar stats={stats} activeFilter={filter} onFilter={setFilter} />
        <Toolbar
          search={search}
          onSearch={setSearch}
          onAdd={() => setShowAdd(true)}
          count={filtered.length}
        />
        <GuestGrid
          guests={filtered}
          onSelect={setSelectedGuest}
          selectedId={selectedGuest?.id}
        />
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔍</span>
            <p>No guests match your search.</p>
          </div>
        )}
      </main>

      {selectedGuest && (
        <GuestDetail
          guest={selectedGuest}
          onClose={() => setSelectedGuest(null)}
          onUpdate={updateGuest}
          onDelete={deleteGuest}
        />
      )}

      {showAdd && (
        <AddGuestModal onClose={() => setShowAdd(false)} onAdd={addGuest} />
      )}
    </div>
  );
}
