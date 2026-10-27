import React, { useState } from 'react'
import { STATUSES, PRIORITIES } from '../data/tickets'
import { priorityColor, statusColor, formatDate, formatDateTime } from '../utils'
import styles from './TicketDetail.module.css'

export default function TicketDetail({ ticket, onStatusChange, onComment }) {
  const [comment, setComment] = useState('')
  const [author, setAuthor] = useState('Agent')

  const handleComment = () => {
    if (!comment.trim()) return
    onComment(ticket.id, author, comment.trim())
    setComment('')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.id}>Ticket #{ticket.id}</span>
          <h1 className={styles.title}>{ticket.title}</h1>
        </div>
        <div className={styles.headerRight}>
          <select
            className={styles.statusSelect}
            value={ticket.status}
            onChange={e => onStatusChange(ticket.id, e.target.value)}
            style={statusColor(ticket.status)}
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.mainCol}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Description</h3>
            <p className={styles.description}>{ticket.description}</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Comments
              <span className={styles.commentCount}>{ticket.comments.length}</span>
            </h3>
            <div className={styles.comments}>
              {ticket.comments.length === 0 && (
                <p className={styles.noComments}>No comments yet.</p>
              )}
              {ticket.comments.map((c, i) => (
                <div key={i} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>{c.author}</span>
                    <span className={styles.commentTime}>{formatDateTime(c.time)}</span>
                  </div>
                  <p className={styles.commentBody}>{c.body}</p>
                </div>
              ))}
            </div>

            <div className={styles.replyBox}>
              <input
                className={styles.authorInput}
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Your name"
              />
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Write a comment…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleComment() }}
              />
              <div className={styles.replyFooter}>
                <span className={styles.hint}>⌘ + Enter to submit</span>
                <button
                  className={styles.replyBtn}
                  onClick={handleComment}
                  disabled={!comment.trim()}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.metaCol}>
          <div className={styles.metaCard}>
            <h3 className={styles.metaTitle}>Details</h3>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Status</span>
              <span className={styles.badge} style={statusColor(ticket.status)}>{ticket.status}</span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Priority</span>
              <span className={styles.priority} style={{ color: priorityColor(ticket.priority) }}>
                {ticket.priority}
              </span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Category</span>
              <span className={styles.metaValue}>{ticket.category}</span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Requester</span>
              <span className={styles.metaValue}>{ticket.requester}</span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Assigned to</span>
              <span className={styles.metaValue}>{ticket.agent}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>{formatDate(ticket.created)}</span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Updated</span>
              <span className={styles.metaValue}>{formatDate(ticket.updated)}</span>
            </div>
          </div>

          <div className={styles.metaCard}>
            <h3 className={styles.metaTitle}>Change Priority</h3>
            <div className={styles.priorityBtns}>
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  className={`${styles.priorityBtn} ${ticket.priority === p ? styles.priorityBtnActive : ''}`}
                  style={ticket.priority === p ? { borderColor: priorityColor(p), color: priorityColor(p) } : {}}
                  onClick={() => {/* handled via onStatusChange pattern – extend as needed */}}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
