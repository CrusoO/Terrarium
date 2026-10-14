import React, { useState, useCallback } from 'react';
import ReceiptCard from '../components/ReceiptCard.jsx';
import useReceipts from '../hooks/useReceipts.js';
import { RefreshCw, Inbox } from 'lucide-react';

export default function LogPage() {
  const { receipts, loading, error, refetch } = useReceipts();
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const handleCardClick = useCallback((receipt) => {
    setSelectedReceipt(receipt);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedReceipt(null);
  }, []);

  return (
    <div className="page page--log">
      <div className="page-header">
        <div className="log-header-row">
          <div>
            <h1 className="page-title">Receipt Log</h1>
            <p className="page-subtitle">
              {receipts.length > 0
                ? `${receipts.length} receipt${receipts.length !== 1 ? 's' : ''} submitted`
                : 'No receipts yet'}
            </p>
          </div>
          <button
            className="btn btn--ghost btn--icon"
            onClick={refetch}
            disabled={loading}
            aria-label="Refresh receipts"
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert--error">
          Failed to load receipts: {error}
        </div>
      )}

      {loading && receipts.length === 0 && (
        <div className="loading-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="receipt-card receipt-card--skeleton" />
          ))}
        </div>
      )}

      {!loading && receipts.length === 0 && !error && (
        <div className="empty-state">
          <Inbox size={48} className="empty-icon" />
          <p className="empty-title">No receipts submitted yet</p>
          <p className="empty-body">
            Switch to the Upload tab to submit your first receipt.
          </p>
        </div>
      )}

      {receipts.length > 0 && (
        <div className="receipt-grid">
          {receipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Detail Modal / Lightbox */}
      {selectedReceipt && (
        <div
          className="modal-overlay"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-label="Receipt detail"
        >
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              ✕
            </button>
            <div className="modal-image-wrap">
              <img
                src={`/uploads/${selectedReceipt.storedFilename}`}
                alt={`Receipt from ${selectedReceipt.staffName}`}
                className="modal-image"
              />
            </div>
            <div className="modal-meta">
              <div className="modal-meta-row">
                <span className="meta-label">Submitted by</span>
                <span className="meta-value">{selectedReceipt.staffName}</span>
              </div>
              <div className="modal-meta-row">
                <span className="meta-label">Date &amp; Time</span>
                <span className="meta-value">
                  {new Date(selectedReceipt.uploadedAt).toLocaleString()}
                </span>
              </div>
              <div className="modal-meta-row">
                <span className="meta-label">File</span>
                <span className="meta-value meta-value--mono">
                  {selectedReceipt.originalFilename}
                </span>
              </div>
              <div className="modal-meta-row">
                <span className="meta-label">Size</span>
                <span className="meta-value">
                  {(selectedReceipt.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </div>
              {selectedReceipt.notes && (
                <div className="modal-notes">
                  <span className="meta-label">Notes</span>
                  <p className="modal-notes-text">{selectedReceipt.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
