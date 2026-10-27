import React, { useState } from 'react';
import { ClipboardList, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import SubmissionCard from './SubmissionCard.jsx';

export default function SubmissionList({ submissions, onClearAll }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first

  const sorted = [...submissions].sort((a, b) => {
    const diff = new Date(b.submittedAt) - new Date(a.submittedAt);
    return sortOrder === 'desc' ? diff : -diff;
  });

  function handleClearAll() {
    if (confirmClear) {
      onClearAll();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  }

  function handleCancelClear() {
    setConfirmClear(false);
  }

  return (
    <section className="list-section">
      <div className="list-section-header">
        <div className="list-section-title-row">
          <div className="list-section-title">
            <ClipboardList size={18} strokeWidth={2} />
            <h2>Submissions Log</h2>
            <span className="list-count">{submissions.length}</span>
          </div>
          <div className="list-section-actions">
            <button
              className="btn-sort"
              onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              title={sortOrder === 'desc' ? 'Showing newest first' : 'Showing oldest first'}
            >
              {sortOrder === 'desc' ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
            </button>
            {submissions.length > 0 && (
              confirmClear ? (
                <div className="confirm-clear">
                  <span>Clear all?</span>
                  <button className="btn-confirm-yes" onClick={handleClearAll}>Yes, clear</button>
                  <button className="btn-confirm-no" onClick={handleCancelClear}>Cancel</button>
                </div>
              ) : (
                <button className="btn-clear" onClick={handleClearAll}>
                  <Trash2 size={14} />
                  Clear all
                </button>
              )
            )}
          </div>
        </div>
        <p className="list-section-desc">
          All homework submissions from this session are listed below.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="list-empty">
          <ClipboardList size={40} strokeWidth={1} className="list-empty-icon" />
          <p className="list-empty-title">No submissions yet</p>
          <p className="list-empty-sub">Submitted assignments will appear here.</p>
        </div>
      ) : (
        <div className="submission-list">
          {sorted.map(sub => (
            <SubmissionCard key={sub.id} submission={sub} />
          ))}
        </div>
      )}
    </section>
  );
}
