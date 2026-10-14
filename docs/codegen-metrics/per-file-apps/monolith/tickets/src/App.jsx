import React, { useState } from 'react'
import TicketList from './components/TicketList'
import TicketDetail from './components/TicketDetail'
import CreateTicketModal from './components/CreateTicketModal'
import { getTickets, createTicket, updateTicket, addComment } from './data/tickets'
import styles from './App.module.css'

export default function App() {
  const [tickets, setTickets] = useState(getTickets)
  const [selectedId, setSelectedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const refresh = () => setTickets(getTickets())

  const handleCreate = (data) => {
    createTicket(data)
    refresh()
    setShowCreate(false)
  }

  const handleStatusChange = (id, status) => {
    updateTicket(id, { status })
    refresh()
  }

  const handleComment = (id, author, body) => {
    addComment(id, author, body)
    refresh()
  }

  const selected = tickets.find(t => t.id === selectedId) || null

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>🎫</span>
            <span className={styles.brandName}>SupportDesk</span>
          </div>
          <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
            + New Ticket
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <TicketList
              tickets={tickets}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </aside>
          <section className={styles.detail}>
            {selected ? (
              <TicketDetail
                ticket={selected}
                onStatusChange={handleStatusChange}
                onComment={handleComment}
              />
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📋</div>
                <p className={styles.emptyTitle}>No ticket selected</p>
                <p className={styles.emptyHint}>Choose a ticket from the list or create a new one.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {showCreate && (
        <CreateTicketModal
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
